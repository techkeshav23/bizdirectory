import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { categoryUpsertSchema, type CategoryUpsertDto } from '@app/types';
import { Public, Roles } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Controller('categories')
class CategoriesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  list(): Promise<unknown> {
    return this.redis.cached('cache:categories:all', 3600, () =>
      this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true, slug: true, iconUrl: true, parentId: true },
      }),
    );
  }

  // --- Admin management (static path declared before :slug) ---
  @Roles('admin')
  @Get('manage')
  adminList(): Promise<unknown> {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        iconUrl: true,
        parentId: true,
        sortOrder: true,
        isActive: true,
        parent: { select: { name: true } },
      },
    });
  }

  @Roles('admin')
  @Post()
  async create(
    @Body(new ZodValidationPipe(categoryUpsertSchema)) dto: CategoryUpsertDto,
  ): Promise<unknown> {
    const created = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        parentId: dto.parentId ?? null,
        iconUrl: dto.iconUrl ?? null,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
    await this.redis.del('cache:categories:all');
    return created;
  }

  @Roles('admin')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(categoryUpsertSchema.partial())) dto: Partial<CategoryUpsertDto>,
  ): Promise<unknown> {
    const updated = await this.prisma.category.update({ where: { id }, data: dto });
    await this.redis.del('cache:categories:all');
    return updated;
  }

  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ ok: true }> {
    const [businessCount, childCount] = await Promise.all([
      this.prisma.business.count({ where: { primaryCategoryId: id } }),
      this.prisma.category.count({ where: { parentId: id } }),
    ]);
    if (businessCount > 0 || childCount > 0) {
      throw new ConflictException(
        `Cannot delete category: ${businessCount} business(es) and ${childCount} child categor${
          childCount === 1 ? 'y' : 'ies'
        } reference it`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
    await this.redis.del('cache:categories:all');
    return { ok: true };
  }

  @Public()
  @Get(':slug')
  async bySlug(@Param('slug') slug: string): Promise<unknown> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }
}

@Module({ controllers: [CategoriesController] })
export class CategoriesModule {}
