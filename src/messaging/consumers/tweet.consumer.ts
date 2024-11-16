import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TweetsService } from '../../tweets/tweets.service';
import { SearchService } from '../../search/search.service';
import { Tweet } from '../../tweets/entities/tweet.entity';

@Controller()
export class TweetConsumerController {
  private readonly logger = new Logger(TweetConsumerController.name);

  constructor(
    private readonly tweetsService: TweetsService,
    private readonly searchService: SearchService,
  ) {}

  @EventPattern('tweet_created')
  async handleTweetCreated(@Payload() message: { data: Tweet }) {
    const tweet = message.data;
    this.logger.log(
      `Received 'tweet_created' message for Tweet ID: ${tweet.id}`,
    );
    await this.searchService.indexTweet(tweet);
    return 'Tweet Created Event Processed';
  }

  @EventPattern('tweet_updated')
  async handleTweetUpdated(@Payload() message: { data: Tweet }) {
    const tweet = message.data;
    this.logger.log(
      `Received 'tweet_updated' message for Tweet ID: ${tweet.id}`,
    );
    await this.searchService.updateTweet(tweet);
    await this.tweetsService.handlePermissionInheritance(tweet.id);
    return 'Tweet Updated Event Processed';
  }
}
