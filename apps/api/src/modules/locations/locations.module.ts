import { Controller, Get, Module, Query } from '@nestjs/common';
import type { LocationType } from '@app/types';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Controller('locations')
class LocationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  list(
    @Query('type') type?: LocationType,
    @Query('parentId') parentId?: string,
  ): Promise<unknown> {
    const key = `cache:locations:${type ?? 'all'}:${parentId ?? 'root'}`;
    return this.redis.cached(key, 86400, () =>
      this.prisma.location.findMany({
        where: { ...(type ? { type } : {}), ...(parentId ? { parentId } : {}) },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true, type: true, parentId: true, pincode: true },
      }),
    );
  }
}

@Module({ controllers: [LocationsController] })
export class LocationsModule {}
