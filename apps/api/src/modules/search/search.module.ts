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
  ): Promise<{ items: unknown[]; nextCursor: string | null }> {
    const where: Prisma.BusinessWhereInput = {
      status: 'active',
      deletedAt: null,
    };

    if (q.q) {
      where.OR = [
        { name: { contains: q.q, mode: 'insensitive' } },
        { description: { contains: q.q, mode: 'insensitive' } },
      ];
    }
    if (q.verified) where.gstinStatus = 'verified';
    if (q.category) {
      where.OR = [
        { primaryCategory: { slug: q.category } },
        { categories: { some: { category: { slug: q.category } } } },
      ];
    }
    if (q.city) where.location = { slug: q.city };

    const orderBy: Prisma.BusinessOrderByWithRelationInput[] =
      q.sort === 'rating'
        ? [{ ratingAvg: 'desc' }, { id: 'desc' }]
        : q.sort === 'recent'
          ? [{ createdAt: 'desc' }, { id: 'desc' }]
          : [{ isFeatured: 'desc' }, { ratingAvg: 'desc' }, { id: 'desc' }];

    const items = await this.prisma.business.findMany({
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
    });

    let nextCursor: string | null = null;
    if (items.length > q.limit) {
      const next = items.pop();
      nextCursor = next?.id ?? null;
    }
    return { items, nextCursor };
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
