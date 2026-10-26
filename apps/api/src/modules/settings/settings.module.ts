import { Body, Controller, Get, Module, Patch } from '@nestjs/common';
import { settingsUpdateSchema, type SettingsUpdateDto } from '@app/types';
import { Public, Roles } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { PrismaService } from '../../prisma/prisma.service';

// Only keys with these prefixes are exposed on the public endpoint.
const PUBLIC_PREFIXES = ['seo.'];

@Controller('settings')
class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('public')
  async publicSettings(): Promise<Record<string, string | null>> {
    const rows = await this.prisma.siteSetting.findMany();
    const out: Record<string, string | null> = {};
    for (const r of rows) {
      if (PUBLIC_PREFIXES.some((p) => r.key.startsWith(p))) out[r.key] = r.value;
    }
    return out;
  }

  @Roles('admin')
  @Get()
  async all(): Promise<Record<string, string | null>> {
    const rows = await this.prisma.siteSetting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  @Roles('admin')
  @Patch()
  async update(
    @Body(new ZodValidationPipe(settingsUpdateSchema)) dto: SettingsUpdateDto,
  ): Promise<{ ok: true }> {
    await Promise.all(
      Object.entries(dto.settings).map(([key, value]) =>
        this.prisma.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    );
    return { ok: true };
  }
}

@Module({ controllers: [SettingsController] })
export class SettingsModule {}
