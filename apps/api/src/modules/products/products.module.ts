import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  createProductSchema,
  updateProductSchema,
  tagBusiness,
  tagProduct,
  type CreateProductDto,
  type UpdateProductDto,
} from '@app/types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CurrentUser, Public, Roles, type AuthUser } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.service';
import { RevalidateService } from '../revalidate/revalidate.service';
import { shortId, slugify } from '../../common/crypto.util';

@Controller()
class ProductsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidate: RevalidateService,
  ) {}

  @Roles('business_owner', 'admin')
  @Post('products')
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createProductSchema)) dto: CreateProductDto,
  ): Promise<unknown> {
    await this.assertOwner(user, dto.businessId);
    // Free tier is capped at 3 products; paid tiers are unlimited.
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
      select: { subscriptionTier: true },
    });
    const isFree = !business?.subscriptionTier || business.subscriptionTier === 'free';
    if (isFree) {
      const count = await this.prisma.product.count({
        where: { businessId: dto.businessId, deletedAt: null },
      });
      if (count >= 3) {
        throw new ForbiddenException('Free plan allows up to 3 products. Upgrade to add more.');
      }
    }
    const publicId = shortId(8);
    const product = await this.prisma.product.create({
      data: {
        businessId: dto.businessId,
        name: dto.name,
        slug: `${slugify(dto.name)}-${publicId.slice(0, 4)}`,
        publicId,
        description: dto.description,
        categoryId: dto.categoryId,
        price: dto.price,
        priceUnit: dto.priceUnit,
        currency: dto.currency,
        images: dto.imageUrls
          ? { create: dto.imageUrls.map((url, i) => ({ url, sortOrder: i, isPrimary: i === 0 })) }
          : undefined,
      },
    });
    this.revalidate.revalidate([
      'business',
      'product',
      tagProduct(product.id),
      tagBusiness(dto.businessId),
    ]);
    return product;
  }

  @Public()
  @Get('businesses/:slug/products')
  async byBusiness(@Param('slug') slug: string): Promise<unknown> {
    const business = await this.prisma.business.findUnique({ where: { slug } });
    if (!business) throw new NotFoundException('Business not found');
    return this.prisma.product.findMany({
      where: { businessId: business.id, deletedAt: null, isAvailable: true },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Public()
  @Get('products/:slug')
  async bySlug(@Param('slug') slug: string): Promise<unknown> {
    const product = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        business: {
          select: { id: true, name: true, slug: true, contactPhone: true, whatsappNumber: true },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  @Roles('business_owner', 'admin')
  @Patch('products/:id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) dto: UpdateProductDto,
  ): Promise<unknown> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    await this.assertOwner(user, product.businessId);
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        price: dto.price,
        priceUnit: dto.priceUnit,
        currency: dto.currency,
      },
    });
    this.revalidate.revalidate(['business', 'product', tagProduct(id), tagBusiness(product.businessId)]);
    return updated;
  }

  @Roles('business_owner', 'admin')
  @Delete('products/:id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<{ ok: true }> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    await this.assertOwner(user, product.businessId);
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
    this.revalidate.revalidate(['business', 'product', tagProduct(id), tagBusiness(product.businessId)]);
    return { ok: true };
  }

  private async assertOwner(user: AuthUser, businessId: string): Promise<void> {
    if (user.role === 'admin') return;
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    if (business.ownerId !== user.id) throw new ForbiddenException('Not your business');
  }
}

@Module({ controllers: [ProductsController] })
export class ProductsModule {}
