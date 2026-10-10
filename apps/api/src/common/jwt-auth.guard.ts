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
import type { Env } from '../config/env';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly config: ConfigService<Env, true>,
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

    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        role: AuthUser['role'];
        pv: boolean;
      }>(token, { secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }) });
      (request as Request & { user: AuthUser }).user = {
        id: payload.sub,
        role: payload.role,
        phoneVerified: payload.pv,
      };
      return true;
    } catch {
      if (isPublic) return true;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice(7);
    const cookies = (request as Request & { cookies?: Record<string, string> }).cookies;
    return cookies?.access_token;
  }
}
