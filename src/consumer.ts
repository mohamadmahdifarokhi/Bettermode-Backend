import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URI || 'amqp://guest:guest@localhost:5672'],
        queue: 'tweet_queue',
        queueOptions: {
          durable: false,
        },
        socketOptions: {
          heartbeat: 5,
        },
      },
    },
  );

  const logger = new Logger('Consumer');

  await app.listen();

  logger.log('TweetConsumer is listening for messages...');
}

bootstrap();
