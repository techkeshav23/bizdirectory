import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  createBusinessSchema,
  submitGstinSchema,
  updateBusinessSchema,
  type CreateBusinessDto,
  type SubmitGstinDto,
  type UpdateBusinessDto,
} from '@app/types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CurrentUser, Public, Roles, type AuthUser } from '../../common/decorators';
import { BusinessesService } from './businesses.service';

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businesses: BusinessesService) {}

  // A first-time customer may create a listing; create() promotes them to
  // business_owner. The JwtAuthGuard reads the fresh DB role on later requests,
  // so owner-only routes work immediately after promotion (no re-login needed).
  @Roles('customer', 'business_owner', 'admin')
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createBusinessSchema)) dto: CreateBusinessDto,
  ): Promise<unknown> {
    return this.businesses.create(user.id, dto);
  }

  @Roles('business_owner', 'admin')
  @Get('mine')
  mine(@CurrentUser() user: AuthUser): Promise<unknown> {
    return this.businesses.listMine(user.id);
  }

  @Roles('business_owner', 'admin')
  @Get('manage/:id')
  manageDetail(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<unknown> {
    return this.businesses.getMineDetail(user.id, id);
  }

  @Public()
  @Get(':slug')
  bySlug(@Param('slug') slug: string): Promise<unknown> {
    return this.businesses.getBySlug(slug);
  }

  @Roles('business_owner', 'admin')
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBusinessSchema)) dto: UpdateBusinessDto,
  ): Promise<unknown> {
    return this.businesses.update(user.id, id, dto);
  }

  @Roles('business_owner', 'admin')
  @Post(':id/submit')
  submit(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<unknown> {
    return this.businesses.submit(user.id, id);
  }

  @Roles('business_owner', 'admin')
  @Post(':id/gstin')
  submitGstin(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(submitGstinSchema)) dto: SubmitGstinDto,
  ): Promise<unknown> {
    return this.businesses.submitGstin(user.id, id, dto.gstin);
  }

  @Roles('business_owner', 'admin')
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<{ ok: true }> {
    return this.businesses.remove(user.id, id);
  }
}
