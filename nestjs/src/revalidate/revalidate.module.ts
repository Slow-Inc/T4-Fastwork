import { Module } from '@nestjs/common';
import { RevalidateService } from './revalidate.service';

/** Provides RevalidateService to the rank + GitHub write paths (#92). */
@Module({
  providers: [RevalidateService],
  exports: [RevalidateService],
})
export class RevalidateModule {}
