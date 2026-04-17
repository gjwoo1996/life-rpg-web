import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { attachRequestId } from './logging/request-id';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(attachRequestId);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
