import { Body, Controller, Module, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CurrentUser, Roles, type AuthUser } from '../../common/decorators';
import { shortId } from '../../common/crypto.util';
import type { Env } from '../../config/env';

const presignSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  kind: z.enum(['logo', 'cover', 'product', 'gallery']),
  businessId: z.string().uuid().optional(),
});
type PresignDto = z.infer<typeof presignSchema>;

/**
 * Returns a presigned PUT URL for R2/S3 when credentials are configured, plus the
 * eventual public URL. Falls back to uploadUrl:null (UI shows a URL field) when
 * storage is not yet configured, so the app still builds/runs without creds.
 */
@Controller('uploads')
class UploadsController {
  constructor(private readonly config: ConfigService<Env, true>) {}

  @Roles('business_owner', 'admin')
  @Post('presign')
  async presign(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(presignSchema)) dto: PresignDto,
  ): Promise<{ key: string; publicUrl: string; uploadUrl: string | null }> {
    const ext = dto.contentType.split('/')[1];
    // Scope to the business when known, else the user — keeps objects tidy.
    const scope = dto.businessId ?? user.id;
    const key = `${dto.kind}/${scope}/${shortId(12)}.${ext}`;
    const publicBase = (
      this.config.get('R2_PUBLIC_BASE', { infer: true }) ?? 'https://cdn.example.com'
    ).replace(/\/$/, '');
    const publicUrl = `${publicBase}/${key}`;

    const accountId = this.config.get('R2_ACCOUNT_ID', { infer: true });
    const accessKeyId = this.config.get('R2_ACCESS_KEY_ID', { infer: true });
    const secretAccessKey = this.config.get('R2_SECRET_ACCESS_KEY', { infer: true });
    const bucket = this.config.get('R2_BUCKET', { infer: true });

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      return { key, publicUrl, uploadUrl: null };
    }

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: dto.contentType }),
      { expiresIn: 300 },
    );
    return { key, publicUrl, uploadUrl };
  }
}

@Module({ controllers: [UploadsController] })
export class UploadsModule {}
