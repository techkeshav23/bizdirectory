import { Controller, Get } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Controller('health')
class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  async check(): Promise<{ status: string; db: boolean; redis: boolean }> {
    const [db, redis] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      this.redis.client.ping().then((r) => r === 'PONG').catch(() => false),
    ]);
    return { status: db && redis ? 'ok' : 'degraded', db, redis };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
