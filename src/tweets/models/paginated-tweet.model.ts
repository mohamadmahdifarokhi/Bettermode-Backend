import { ObjectType, Field } from '@nestjs/graphql';
import { Tweet } from '../entities/tweet.entity';

@ObjectType()
export class PaginatedTweet {
  @Field(() => [Tweet], { description: 'List of tweets' })
  public nodes: Tweet[] = [];

  @Field(() => Boolean, {
    description: 'Indicates if there are more tweets to fetch',
  })
  public hasNextPage = false;
}
