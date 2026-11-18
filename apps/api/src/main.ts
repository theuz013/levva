import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.WEB_ORIGIN?.split(',') ?? ['http://localhost:3000'] });
  const porta = Number(process.env.PORT ?? 3333);
  await app.listen(porta);
  console.log(`API Levva em http://localhost:${porta}`);
}
bootstrap();
