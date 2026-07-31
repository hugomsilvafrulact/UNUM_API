import { Module } from '@nestjs/common';
import { SapConnectionService } from './sap-connection.service';

@Module({
  providers: [SapConnectionService],
  exports: [SapConnectionService],
})
export class SapModule {}
