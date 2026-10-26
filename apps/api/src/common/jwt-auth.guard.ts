import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY, type AuthUser } from './decorators';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException('Missing authentication token');
    }

    let payload: { sub: string; role: AuthUser['role']; pv: boolean };
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      });
    } catch {
      if (isPublic) return true;
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Public routes: optional auth. Trust the token (no DB hit) so high-traffic
    // public endpoints stay fast; authz is not enforced here anyway.
    if (isPublic) {
      (request as Request & { user: AuthUser }).user = {
        id: payload.sub,
        role: payload.role,
        phoneVerified: payload.pv,
      };
      return true;
    }

    // Protected routes: load the live user so (a) blocked/deleted accounts lose
    // access immediately and (b) the role is always fresh — e.g. a customer who
    // just created their first listing is now a business_owner without re-login.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { role: true, status: true, deletedAt: true },
    });
    if (!user || user.deletedAt || user.status === 'blocked') {
      throw new UnauthorizedException('Account is blocked or no longer exists');
    }

    (request as Request & { user: AuthUser }).user = {
      id: payload.sub,
      role: user.role,
      phoneVerified: payload.pv,
    };
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice(7);
    const cookies = (request as Request & { cookies?: Record<string, string> }).cookies;
    return cookies?.access_token;
  }
}
