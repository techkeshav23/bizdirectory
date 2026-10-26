import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import type { Env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<Env, true>);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }).split(',').map((s) => s.trim()),
    credentials: true,
  });
  app.useGlobalFilters(new AllExceptionsFilter());

  if (config.get('NODE_ENV', { infer: true }) !== 'production') {
    const swagger = new DocumentBuilder()
      .setTitle('BizDirectory API')
      .setDescription('B2B business discovery & directory platform — Phase 1')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));
  }

  const port = config.get('API_PORT', { infer: true });
  await app.listen(port);
  app.get(Logger).log(`API running on http://localhost:${port}/api`);
}

void bootstrap();
