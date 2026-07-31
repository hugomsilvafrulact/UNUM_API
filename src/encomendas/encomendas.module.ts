import { Module } from '@nestjs/common';
import { SapModule } from '../sap/sap.module';
import { EncomendasController } from './encomendas.controller';
import { EncomendasService } from './encomendas.service';
import { EncomendasRepository } from './encomendas.repository';

@Module({
  imports: [SapModule],
  controllers: [EncomendasController],
  providers: [EncomendasService, EncomendasRepository],
})
export class EncomendasModule {}
