import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from '../config/configuration';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const db = configService.get('database', { infer: true });

        return {
          type: 'mssql' as const,
          host: db.host,
          port: db.port,
          database: db.database,
          username: db.username,
          password: db.password,
          options: {
            instanceName: db.instanceName,
            encrypt: db.encrypt,
            trustServerCertificate: db.trustServerCertificate,
          },
          // Não existem Entities mapeadas: a escrita em UNUM é feita através das
          // stored procedures DAL.AcessData_DB.ENCOMENDAS_* (ver EncomendasRepository),
          // pelo que o acesso é feito via DataSource/QueryRunner e não via Repository<Entity>.
          entities: [],
          autoLoadEntities: true,
          synchronize: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
