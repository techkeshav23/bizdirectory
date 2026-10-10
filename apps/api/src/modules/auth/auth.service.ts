import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import type { OtpRequestDto, OtpVerifyDto } from '@app/types';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { generateOtp, normalizePhone, sha256 } from '../../common/crypto.util';
import type { Env } from '../../config/env';
import { SmsService } from './sms.service';
import { TokenService, type TokenPair } from './token.service';

interface RequestMeta {
  userAgent?: string;
  ipHash?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly sms: SmsService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async requestOtp(dto: OtpRequestDto): Promise<{ sent: true }> {
    const phone = normalizePhone(dto.phone);

    const allowed = await this.redis.rateLimit(`otp:req:${phone}`, 3, 15 * 60);
    if (!allowed) {
      throw new HttpException(
        'Too many OTP requests. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = generateOtp();
    const ttl = this.config.get('OTP_TTL', { infer: true });
    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash: sha256(code),
        purpose: dto.purpose,
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });
    await this.redis.setex(`otp:code:${phone}`, ttl, sha256(code));
    await this.sms.sendOtp(phone, code);
    return { sent: true };
  }

  async verifyOtp(dto: OtpVerifyDto, meta: RequestMeta): Promise<TokenPair & { userId: string }> {
    const phone = normalizePhone(dto.phone);
    const maxAttempts = this.config.get('OTP_MAX_ATTEMPTS', { infer: true });

    const record = await this.prisma.otpCode.findFirst({
      where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) throw new BadRequestException('OTP expired or not found. Request a new one.');
    if (record.attempts >= maxAttempts) {
      throw new HttpException('Too many attempts. Request a new OTP.', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (record.codeHash !== sha256(dto.code)) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Incorrect OTP');
    }

    await this.prisma.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
    await this.redis.del(`otp:code:${phone}`);

    const user = await this.prisma.user.upsert({
      where: { phone },
      update: { isPhoneVerified: true, lastLoginAt: new Date() },
      create: { phone, isPhoneVerified: true, consentAt: new Date(), lastLoginAt: new Date() },
    });

    const pair = await this.tokens.issuePair(user.id, user.role, true, meta);
    return { ...pair, userId: user.id };
  }

  async adminLogin(
    email: string,
    password: string,
    meta: RequestMeta,
  ): Promise<TokenPair & { userId: string }> {
    const cred = await this.prisma.adminCredential.findUnique({
      where: { email },
      include: { user: true },
    });
    if (!cred || !(await argon2.verify(cred.passwordHash, password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.prisma.adminCredential.update({
      where: { id: cred.id },
      data: { lastLoginAt: new Date() },
    });
    const pair = await this.tokens.issuePair(cred.userId, cred.user.role, true, meta);
    return { ...pair, userId: cred.userId };
  }

  refresh(refreshToken: string, meta: RequestMeta): Promise<TokenPair> {
    return this.tokens.rotate(refreshToken, meta);
  }

  async logout(refreshToken: string): Promise<void> {
    if (refreshToken) await this.tokens.revoke(refreshToken);
  }
}
