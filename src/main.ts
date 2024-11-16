import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(new ValidationPipe());
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URI],
      queue: 'tweet_queue',
      queueOptions: {
        durable: false,
      },
      socketOptions: {
        heartbeat: 5,
      },
    },
  } as MicroserviceOptions);

  await app.startAllMicroservices();
  const port = parseInt(process.env.PORT || '3010', 10);
  await app.listen(port);
}
bootstrap();
