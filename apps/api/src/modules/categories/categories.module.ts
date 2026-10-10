import { Controller, Get, Module, NotFoundException, Param } from '@nestjs/common';
import { Public } from '../../common/decorators';
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
