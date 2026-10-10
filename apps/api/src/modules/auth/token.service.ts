import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { UserRole } from '@app/types';
import { PrismaService } from '../../prisma/prisma.service';
import { randomToken, sha256 } from '../../common/crypto.util';
import type { Env } from '../../config/env';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async issuePair(
    userId: string,
    role: UserRole,
    phoneVerified: boolean,
    meta: { userAgent?: string; ipHash?: string | null } = {},
  ): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, role, pv: phoneVerified },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_ACCESS_TTL', { infer: true }),
      },
    );

    const refreshToken = randomToken();
    const ttl = this.config.get('JWT_REFRESH_TTL', { infer: true });
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: sha256(refreshToken),
        userAgent: meta.userAgent?.slice(0, 255),
        ipHash: meta.ipHash ?? null,
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });
    return { accessToken, refreshToken };
  }

  /** Rotates a refresh token, detecting reuse of a revoked one. */
  async rotate(refreshToken: string, meta: { userAgent?: string; ipHash?: string | null } = {}): Promise<TokenPair> {
    const hash = sha256(refreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
      include: { user: true },
    });

    if (!existing || existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (existing.revokedAt) {
      // Reuse detected → revoke the whole chain for this user.
      await this.prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const pair = await this.issuePair(
      existing.userId,
      existing.user.role,
      existing.user.isPhoneVerified,
      meta,
    );
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedById: null },
    });
    return pair;
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
