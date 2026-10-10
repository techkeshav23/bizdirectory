import { Body, Controller, Delete, Get, Module, Patch } from '@nestjs/common';
import { updateProfileSchema, type UpdateProfileDto } from '@app/types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.service';

const userSelect = {
  id: true,
  phone: true,
  email: true,
  fullName: true,
  role: true,
  isPhoneVerified: true,
  createdAt: true,
} as const;

@Controller('users')
class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.prisma.user.findUnique({ where: { id: user.id }, select: userSelect });
  }

  @Patch('me')
  update(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
  ): Promise<unknown> {
    return this.prisma.user.update({
      where: { id: user.id },
      data: { fullName: dto.fullName, email: dto.email },
      select: userSelect,
    });
  }

  @Delete('me')
  async remove(@CurrentUser() user: AuthUser): Promise<{ ok: true }> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date(), status: 'blocked' },
    });
    return { ok: true };
  }
}

@Module({ controllers: [UsersController] })
export class UsersModule {}
