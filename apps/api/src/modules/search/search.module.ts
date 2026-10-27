import { Controller, Get, Module, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { searchQuerySchema, type SearchQueryDto } from '@app/types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Phase-1 search: PostgreSQL ILIKE + trigram-friendly filters over active
 * businesses. Isolated here so it can be swapped for Typesense/Meilisearch later
 * without touching callers.
 */
@Controller('search')
class SearchController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async search(
    @Query(new ZodValidationPipe(searchQuerySchema)) q: SearchQueryDto,
  ): Promise<{ items: unknown[]; nextCursor: string | null; total: number }> {
    const where: Prisma.BusinessWhereInput = {
      status: 'active',
      deletedAt: null,
    };

    // Each constraint is its own AND entry so combining keyword + category does
    // NOT clobber the other (a plain `where.OR =` twice loses the first group).
    const and: Prisma.BusinessWhereInput[] = [];
    if (q.q) {
      and.push({
        OR: [
          { name: { contains: q.q, mode: 'insensitive' } },
          { description: { contains: q.q, mode: 'insensitive' } },
        ],
      });
    }
    if (q.category) {
      and.push({
        OR: [
          { primaryCategory: { slug: q.category } },
          { categories: { some: { category: { slug: q.category } } } },
        ],
      });
    }
    // Accept a slug OR a human-typed city name (header search sends the name).
    if (q.city) {
      and.push({
        location: {
          is: {
            type: 'city',
            OR: [{ slug: q.city }, { name: { equals: q.city, mode: 'insensitive' } }],
          },
        },
      });
    }
    if (q.verified) where.gstinStatus = 'verified';
    if (and.length) where.AND = and;

    const orderBy: Prisma.BusinessOrderByWithRelationInput[] =
      q.sort === 'rating'
        ? [{ ratingAvg: 'desc' }, { id: 'desc' }]
        : q.sort === 'recent'
          ? [{ createdAt: 'desc' }, { id: 'desc' }]
          : [{ isFeatured: 'desc' }, { ratingAvg: 'desc' }, { id: 'desc' }];

    const [items, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        orderBy,
        take: q.limit + 1,
        ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          ratingAvg: true,
          ratingCount: true,
          gstinStatus: true,
          isFeatured: true,
          isSponsored: true,
          primaryCategory: { select: { name: true, slug: true } },
          location: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.business.count({ where }),
    ]);

    let nextCursor: string | null = null;
    if (items.length > q.limit) {
      const next = items.pop();
      nextCursor = next?.id ?? null;
    }
    return { items, nextCursor, total };
  }

  // Landing pages that qualify for indexing: a category / city / combo must have
  // at least MIN_PUBLISH active listings. Prevents thin/empty SEO pages and keeps
  // the sitemap from emitting the full category×city cartesian product.
  @Public()
  @Get('landing')
  async landing(): Promise<{
    categories: string[];
    cities: string[];
    combos: { category: string; city: string }[];
  }> {
    const MIN_PUBLISH = 5;
    const where = { status: 'active' as const, deletedAt: null };
    const [byCat, byCity, byCombo] = await Promise.all([
      this.prisma.business.groupBy({
        by: ['primaryCategoryId'],
        where,
        _count: { _all: true },
        having: { primaryCategoryId: { _count: { gte: MIN_PUBLISH } } },
      }),
      this.prisma.business.groupBy({
        by: ['locationId'],
        where,
        _count: { _all: true },
        having: { locationId: { _count: { gte: MIN_PUBLISH } } },
      }),
      this.prisma.business.groupBy({
        by: ['primaryCategoryId', 'locationId'],
        where,
        _count: { _all: true },
        having: { primaryCategoryId: { _count: { gte: MIN_PUBLISH } } },
      }),
    ]);

    const catIds = new Set<string>();
    const locIds = new Set<string>();
    for (const r of byCat) catIds.add(r.primaryCategoryId);
    for (const r of byCity) locIds.add(r.locationId);
    for (const r of byCombo) {
      catIds.add(r.primaryCategoryId);
      locIds.add(r.locationId);
    }
    const [cats, locs] = await Promise.all([
      this.prisma.category.findMany({
        where: { id: { in: [...catIds] } },
        select: { id: true, slug: true },
      }),
      this.prisma.location.findMany({
        where: { id: { in: [...locIds] } },
        select: { id: true, slug: true },
      }),
    ]);
    const catSlug = new Map(cats.map((c) => [c.id, c.slug]));
    const locSlug = new Map(locs.map((l) => [l.id, l.slug]));

    return {
      categories: byCat.map((r) => catSlug.get(r.primaryCategoryId)).filter((s): s is string => !!s),
      cities: byCity.map((r) => locSlug.get(r.locationId)).filter((s): s is string => !!s),
      combos: byCombo
        .map((r) => ({ category: catSlug.get(r.primaryCategoryId), city: locSlug.get(r.locationId) }))
        .filter((x): x is { category: string; city: string } => !!x.category && !!x.city),
    };
  }

  @Public()
  @Get('suggest')
  async suggest(@Query('q') term?: string): Promise<unknown[]> {
    if (!term || term.length < 2) return [];
    return this.prisma.business.findMany({
      where: { status: 'active', deletedAt: null, name: { contains: term, mode: 'insensitive' } },
      take: 8,
      select: { name: true, slug: true, location: { select: { name: true } } },
    });
  }
}

@Module({ controllers: [SearchController] })
export class SearchModule {}
