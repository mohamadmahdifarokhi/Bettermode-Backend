import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { TweetsService } from './tweets.service';
import { Tweet } from './entities/tweet.entity';
import { CreateTweetInput } from './dto/create-tweet.input';
import { UpdateTweetPermissionsInput } from '../permissions/dto/update-tweet-permissions.input';
import { PaginatedTweet } from './models/paginated-tweet.model';
import { FilterTweetsInput } from './dto/filter-tweets.input';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { AddUserToGroupInput } from '../groups/dto/add-user-to-group.input';

@Resolver(() => Tweet)
export class TweetsResolver {
  constructor(private readonly tweetsService: TweetsService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Tweet)
  public async createTweet(
    @Args('input') input: CreateTweetInput,
    @CurrentUser() user: User,
  ): Promise<Tweet> {
    if (input.authorId !== user.id) {
      throw new ForbiddenException('You can only create tweets for yourself');
    }
    return this.tweetsService.createTweet(input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  public async updateTweetPermissions(
    @Args('input') input: UpdateTweetPermissionsInput,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    const tweet = await this.tweetsService.findById(input.tweetId);
    if (tweet.author.id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to update this tweet',
      );
    }
    return this.tweetsService.updateTweetPermissions(input);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => PaginatedTweet)
  public async paginateTweets(
    @Args('limit') limit: number,
    @Args('page') page: number,
    @CurrentUser() user: User,
    @Args('filter', { nullable: true }) filter?: FilterTweetsInput,
  ): Promise<PaginatedTweet> {
    return this.tweetsService.paginateTweets(limit, page, filter);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => Boolean)
  public async canEditTweet(
    @Args('tweetId') tweetId: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.tweetsService.canEditTweet(user.id, tweetId);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => Tweet, { name: 'tweet' })
  public async getTweet(
    @Args('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Tweet> {
    const tweet = await this.tweetsService.findById(id);

    const canView = await this.tweetsService.canUserViewTweet(
      user.id,
      await this.tweetsService.getAllGroupsForUser(user.id),
      tweet,
    );
    if (!canView) {
      throw new ForbiddenException(
        'You do not have permission to view this tweet',
      );
    }

    return tweet;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Tweet], { name: 'tweets' })
  public async getTweets(
    @CurrentUser() user: User,
    @Args('filter', { nullable: true }) filter?: FilterTweetsInput,
  ): Promise<Tweet[]> {
    return this.tweetsService.findAll(filter);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Tweet], { name: 'tweetsByUser' })
  public async getTweetsByUser(
    @Args('userId') userId: string,
    @CurrentUser() user: User,
  ): Promise<Tweet[]> {
    if (userId !== user.id) {
      throw new ForbiddenException('You can only view your own tweets');
    }
    return this.tweetsService.findByAuthor(userId);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Tweet], { name: 'tweetsByContent' })
  public async getTweetByContent(
    @CurrentUser() user: User,
    @Args('content') content: string,
  ): Promise<Tweet[]> {
    return this.tweetsService.findByContent(content);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Group)
  public async addUserToGroup(
    @CurrentUser() user: User,
    @Args('input') input: AddUserToGroupInput,
  ): Promise<Group> {
    return this.tweetsService.addUserToGroup(input);
  }
}
