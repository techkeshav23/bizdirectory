import { Module } from '@nestjs/common';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { GstinService } from './gstin.service';

@Module({
  controllers: [BusinessesController],
  providers: [BusinessesService, GstinService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
