import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('UNUM API - Encomendas')
    .setDescription(
      'API REST para criacao, simulacao, alteracao, fecho e eliminacao de encomendas, com integracao SAP (BAPI_SALESORDER_*) e UNUM.',
    )
    .setVersion('1.0')
    .addTag('encomendas')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, documentFactory);

  const configService = app.get<ConfigService<AppConfig, true>>(ConfigService);
  await app.listen(configService.get('port', { infer: true }));
}

bootstrap();
