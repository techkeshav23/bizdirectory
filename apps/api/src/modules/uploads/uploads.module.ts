import { Body, Controller, Module, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CurrentUser, Roles, type AuthUser } from '../../common/decorators';
import { shortId } from '../../common/crypto.util';

const presignSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  kind: z.enum(['logo', 'cover', 'product', 'gallery']),
});
type PresignDto = z.infer<typeof presignSchema>;

/**
 * Phase-1 uploads: returns an object key + the eventual public URL.
 * A real presigned PUT URL is generated here once R2/S3 creds are set
 * (STORAGE_PROVIDER). For now it returns a deterministic key so the UI flow
 * works end-to-end; wiring the S3 signer is a drop-in follow-up.
 */
@Controller('uploads')
class UploadsController {
  @Roles('business_owner', 'admin')
  @Post('presign')
  presign(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(presignSchema)) dto: PresignDto,
  ): { key: string; publicUrl: string; uploadUrl: string | null } {
    const ext = dto.contentType.split('/')[1];
    const key = `${dto.kind}/${user.id}/${shortId(12)}.${ext}`;
    const base = process.env.R2_PUBLIC_BASE ?? 'https://cdn.example.com';
    return {
      key,
      publicUrl: `${base}/${key}`,
      uploadUrl: null, // populated once STORAGE_PROVIDER creds are configured
    };
  }
}

@Module({ controllers: [UploadsController] })
export class UploadsModule {}
