import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { locationUpsertSchema, type LocationType, type LocationUpsertDto } from '@app/types';
import { Public, Roles } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
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
  list(@Query('type') type?: LocationType, @Query('parentId') parentId?: string): Promise<unknown> {
    const key = `cache:locations:${type ?? 'all'}:${parentId ?? 'root'}`;
    return this.redis.cached(key, 86400, () =>
      this.prisma.location.findMany({
        where: { ...(type ? { type } : {}), ...(parentId ? { parentId } : {}) },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true, type: true, parentId: true, pincode: true },
      }),
    );
  }

  @Roles('admin')
  @Get('manage')
  adminList(): Promise<unknown> {
    return this.prisma.location.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        parentId: true,
        pincode: true,
        parent: { select: { name: true } },
      },
    });
  }

  @Roles('admin')
  @Post()
  async create(
    @Body(new ZodValidationPipe(locationUpsertSchema)) dto: LocationUpsertDto,
  ): Promise<unknown> {
    const created = await this.prisma.location.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        type: dto.type,
        parentId: dto.parentId ?? null,
        pincode: dto.pincode ?? null,
      },
    });
    await this.bust(dto.parentId);
    return created;
  }

  @Roles('admin')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(locationUpsertSchema.partial())) dto: Partial<LocationUpsertDto>,
  ): Promise<unknown> {
    const updated = await this.prisma.location.update({ where: { id }, data: dto });
    await this.bust(dto.parentId);
    return updated;
  }

  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ ok: true }> {
    await this.prisma.location.delete({ where: { id } });
    await this.bust();
    return { ok: true };
  }

  private async bust(parentId?: string | null): Promise<void> {
    const keys = [
      'cache:locations:all:root',
      'cache:locations:state:root',
      'cache:locations:city:root',
      'cache:locations:area:root',
    ];
    if (parentId) {
      keys.push(
        `cache:locations:all:${parentId}`,
        `cache:locations:city:${parentId}`,
        `cache:locations:area:${parentId}`,
      );
    }
    await Promise.all(keys.map((k) => this.redis.del(k)));
  }
}

@Module({ controllers: [LocationsController] })
export class LocationsModule {}
