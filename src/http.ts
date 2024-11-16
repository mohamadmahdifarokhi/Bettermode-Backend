import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = parseInt(process.env.PORT || '3010', 10);
  await app.listen(port);
  Logger.log(`HTTP server is running on port ${port}`, 'Bootstrap');
}
bootstrap();
