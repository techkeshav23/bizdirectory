import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateBusinessDto, UpdateBusinessDto } from '@app/types';
import { tagBusiness, tagCategory, tagCity } from '@app/types';
import { PrismaService } from '../../prisma/prisma.service';
import { RevalidateService } from '../revalidate/revalidate.service';
import { normalizePhone, shortId, slugify } from '../../common/crypto.util';
import { isValidGstin } from '../../common/gstin.util';
import { GstinService } from './gstin.service';

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gstin: GstinService,
    private readonly revalidate: RevalidateService,
  ) {}

  async create(ownerId: string, dto: CreateBusinessDto): Promise<unknown> {
    const location = await this.prisma.location.findUnique({ where: { id: dto.locationId } });
    if (!location) throw new BadRequestException('Invalid location');

    const publicId = shortId(8);
    const slug = `${slugify(dto.name)}-${slugify(location.name)}-${publicId.slice(0, 4)}`;

    const business = await this.prisma.business.create({
      data: {
        ownerId,
        name: dto.name,
        slug,
        publicId,
        description: dto.description,
        primaryCategoryId: dto.primaryCategoryId,
        locationId: dto.locationId,
        address: dto.address,
        pincode: dto.pincode,
        contactPhone: normalizePhone(dto.contactPhone),
        whatsappNumber: dto.whatsappNumber ? normalizePhone(dto.whatsappNumber) : null,
        email: dto.email,
        website: dto.website,
        logoUrl: dto.logoUrl,
        coverUrl: dto.coverUrl,
        status: 'draft',
        categories: dto.categoryIds
          ? { create: dto.categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
    });

    // Promote the user to business_owner on first business.
    await this.prisma.user.updateMany({
      where: { id: ownerId, role: 'customer' },
      data: { role: 'business_owner' },
    });

    return business;
  }

  async update(ownerId: string, id: string, dto: UpdateBusinessDto): Promise<unknown> {
    const existing = await this.ownedOrThrow(ownerId, id);
    const updated = await this.prisma.business.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        primaryCategoryId: dto.primaryCategoryId,
        locationId: dto.locationId,
        address: dto.address,
        pincode: dto.pincode,
        contactPhone: dto.contactPhone ? normalizePhone(dto.contactPhone) : undefined,
        whatsappNumber: dto.whatsappNumber ? normalizePhone(dto.whatsappNumber) : undefined,
        email: dto.email,
        website: dto.website,
        logoUrl: dto.logoUrl,
        coverUrl: dto.coverUrl,
      },
    });
    this.fireRevalidate(existing.id);
    return updated;
  }

  async submit(ownerId: string, id: string): Promise<unknown> {
    await this.ownedOrThrow(ownerId, id);
    return this.prisma.business.update({
      where: { id },
      data: { status: 'pending_review' },
    });
  }

  async remove(ownerId: string, id: string): Promise<{ ok: true }> {
    const existing = await this.ownedOrThrow(ownerId, id);
    await this.prisma.business.update({ where: { id }, data: { deletedAt: new Date() } });
    this.fireRevalidate(existing.id);
    return { ok: true };
  }

  async getMineDetail(ownerId: string, id: string): Promise<unknown> {
    const business = await this.ownedOrThrow(ownerId, id);
    return this.prisma.business.findUnique({
      where: { id: business.id },
      include: {
        primaryCategory: true,
        location: true,
        products: {
          where: { deletedAt: null },
          include: { images: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async listMine(ownerId: string): Promise<unknown> {
    return this.prisma.business.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { primaryCategory: true, location: true, _count: { select: { products: true } } },
    });
  }

  async getBySlug(slug: string): Promise<unknown> {
    let business = await this.prisma.business.findFirst({
      where: { slug, status: 'active', deletedAt: null },
      include: {
        primaryCategory: true,
        location: true,
        categories: { include: { category: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        hours: true,
        products: {
          where: { deletedAt: null, isAvailable: true },
          include: { images: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        },
        reviews: { where: { status: 'approved' }, include: { user: { select: { fullName: true } } } },
      },
    });

    if (!business) {
      // Check slug history for a 301 redirect target.
      const historical = await this.prisma.slugHistory.findUnique({
        where: { entityType_oldSlug: { entityType: 'business', oldSlug: slug } },
        include: { business: true },
      });
      if (historical?.business && historical.business.status === 'active') {
        return { redirectTo: historical.business.slug };
      }
      throw new NotFoundException('Business not found');
    }

    // Async view count via Redis-free increment (simple for MVP).
    void this.prisma.business
      .update({ where: { id: business.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined);

    return business;
  }

  async submitGstin(ownerId: string, id: string, gstin: string): Promise<unknown> {
    await this.ownedOrThrow(ownerId, id);
    if (!isValidGstin(gstin)) {
      throw new BadRequestException('Invalid GSTIN (format or checksum failed)');
    }
    await this.prisma.business.update({
      where: { id },
      data: { gstin, gstinStatus: 'pending' },
    });

    const result = await this.gstin.verify(gstin);
    const updated = await this.prisma.business.update({
      where: { id },
      data: result.valid
        ? { gstinStatus: 'verified', gstinVerifiedAt: new Date(), legalName: result.legalName }
        : { gstinStatus: 'failed' },
      select: { id: true, gstinStatus: true, legalName: true },
    });
    this.fireRevalidate(id);
    return updated;
  }

  private async ownedOrThrow(ownerId: string, id: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business || business.deletedAt) throw new NotFoundException('Business not found');
    if (business.ownerId !== ownerId) throw new ForbiddenException('Not your business');
    return business;
  }

  private fireRevalidate(businessId: string): void {
    // Public business/product pages subscribe to the broad 'business' tag; the
    // id-scoped tag alone never matches the slug-tagged page, so edits would not
    // reflect for ~24h. Bust the broad tag too.
    this.revalidate.revalidate(['business', tagBusiness(businessId)]);
  }

  /** Used by admin on status change to refresh public pages. */
  revalidateBusiness(businessId: string, citySlug?: string, categorySlug?: string): void {
    const tags = ['business', tagBusiness(businessId)];
    if (citySlug) tags.push(tagCity(citySlug));
    if (categorySlug) tags.push(tagCategory(categorySlug));
    this.revalidate.revalidate(tags);
  }
}
