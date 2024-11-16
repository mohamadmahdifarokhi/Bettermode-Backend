import { Module, forwardRef } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { TweetConsumerController } from './consumers/tweet.consumer';
import { SearchModule } from '../search/search.module';
import { TweetsModule } from '../tweets/tweets.module';
import { MessagingResolver } from './messaging.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';

@Module({
  controllers: [TweetConsumerController],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Message]),
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => {
          const rabbitMqUri = configService.get<string>('RABBITMQ_URI');
          if (!rabbitMqUri) {
            throw new Error(
              'RABBITMQ_URI is not defined in the environment variables',
            );
          }

          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitMqUri],
              queue: 'tweet_queue',
              queueOptions: {
                durable: false,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
    SearchModule,
    forwardRef(() => TweetsModule),
  ],
  providers: [MessagingService, TweetConsumerController, MessagingResolver],
  exports: [MessagingService],
})
export class MessagingModule {}
