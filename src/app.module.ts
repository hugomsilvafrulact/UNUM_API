import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { SapModule } from './sap/sap.module';
import { EncomendasModule } from './encomendas/encomendas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    SapModule,
    EncomendasModule,
  ],
})
export class AppModule {}
