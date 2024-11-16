import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { MessagingService } from './messaging.service';
import { Message } from './entities/message.entity';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { SendMessageInput } from './dto/send-message.input';

@Resolver()
export class MessagingResolver {
  constructor(private readonly messagingService: MessagingService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Message)
  async sendMessage(@Args('input') input: SendMessageInput): Promise<Message> {
    return this.messagingService.sendMessage(input);
  }

  @Query(() => [Message])
  @UseGuards(GqlAuthGuard)
  async getMessages(
    @Args('receiverId') receiverId: string,
  ): Promise<Message[]> {
    return this.messagingService.getMessages(receiverId);
  }
}
