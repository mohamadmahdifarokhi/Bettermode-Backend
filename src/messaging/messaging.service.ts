import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SendMessageInput } from './dto/send-message.input';
import { Message } from './entities/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tweet } from '../tweets/entities/tweet.entity';

@Injectable()
export class MessagingService implements OnModuleInit {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async onModuleInit() {
    await this.client.connect();
    this.logger.log('Connected to RabbitMQ.');
  }

  async sendMessage(input: SendMessageInput): Promise<Message> {
    const message = this.messageRepository.create({
      content: input.content,
      senderId: input.senderId,
      receiverId: input.receiverId,
    });

    await this.messageRepository.save(message);

    const fullMessage = await this.messageRepository.findOne({
      where: { id: message.id },
      relations: ['sender', 'receiver'],
    });

    if (!fullMessage) {
      throw new Error('Failed to retrieve full message data after saving.');
    }

    return fullMessage;
  }

  async getMessages(receiverId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { receiverId },
      relations: ['sender', 'receiver'],
    });
  }

  async publishTweetCreated(tweet: Tweet) {
    this.client.emit('tweet_created', { data: tweet });
    this.logger.debug(
      `Published 'tweet_created' event for Tweet ID: ${tweet.id}`,
    );
  }

  async publishTweetUpdated(tweet: Tweet) {
    this.client.emit('tweet_updated', { data: tweet });
    this.logger.debug(
      `Published 'tweet_updated' event for Tweet ID: ${tweet.id}`,
    );
  }
}
