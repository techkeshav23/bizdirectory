import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  adminLoginSchema,
  otpRequestSchema,
  otpVerifySchema,
  type AdminLoginDto,
  type OtpRequestDto,
  type OtpVerifyDto,
} from '@app/types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CurrentUser, Public, type AuthUser } from '../../common/decorators';
import { hashIp } from '../../common/crypto.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import type { TokenPair } from './token.service';

function setAuthCookies(res: Response, pair: TokenPair): void {
  // Secure cookies are REJECTED by browsers over plain HTTP. This deployment is
  // served over HTTP (sslip.io, no SSL), so default to non-secure and let an
  // explicit COOKIE_SECURE=true re-enable it once the site is behind HTTPS.
  const secure = process.env.COOKIE_SECURE === 'true';
  res.cookie('access_token', pair.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 2 * 60 * 60 * 1000,
    path: '/',
  });
  res.cookie('refresh_token', pair.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    // Path '/' so the cookie reaches the Next proxy (/api/proxy/auth/refresh).
    path: '/',
  });
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Throttle({ default: { ttl: 900_000, limit: 10 } })
  @Post('otp/request')
  @UsePipes(new ZodValidationPipe(otpRequestSchema))
  requestOtp(@Body() dto: OtpRequestDto): Promise<{ sent: true }> {
    return this.auth.requestOtp(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 900_000, limit: 20 } })
  @Post('otp/verify')
  async verifyOtp(
    @Body(new ZodValidationPipe(otpVerifySchema)) dto: OtpVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ userId: string }> {
    const result = await this.auth.verifyOtp(dto, {
      userAgent: req.headers['user-agent'],
      ipHash: hashIp(req.ip),
    });
    setAuthCookies(res, result);
    return { userId: result.userId };
  }

  @Public()
  @Throttle({ default: { ttl: 900_000, limit: 10 } })
  @Post('admin/login')
  async adminLogin(
    @Body(new ZodValidationPipe(adminLoginSchema)) dto: AdminLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ userId: string }> {
    const result = await this.auth.adminLogin(dto.email, dto.password, {
      userAgent: req.headers['user-agent'],
      ipHash: hashIp(req.ip),
    });
    setAuthCookies(res, result);
    return { userId: result.userId };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    const token = (req.cookies as Record<string, string>)?.refresh_token;
    if (!token) throw new UnauthorizedException('No refresh token');
    const pair = await this.auth.refresh(token, {
      userAgent: req.headers['user-agent'],
      ipHash: hashIp(req.ip),
    });
    setAuthCookies(res, pair);
    return { ok: true };
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    const token = (req.cookies as Record<string, string>)?.refresh_token;
    if (token) await this.auth.logout(token);
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    return { ok: true };
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        phone: true,
        email: true,
        fullName: true,
        role: true,
        isPhoneVerified: true,
      },
    });
  }
}
