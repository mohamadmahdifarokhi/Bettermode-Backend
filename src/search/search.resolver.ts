import { Resolver, Query, Args } from '@nestjs/graphql';
import { SearchService } from './search.service';
import { SearchTweetDTO } from './dto/search-tweet.dto';

@Resolver(() => SearchTweetDTO)
export class SearchResolver {
  constructor(private readonly searchService: SearchService) {}

  @Query(() => [SearchTweetDTO], { name: 'searchTweets' })
  public async searchTweets(
    @Args('query') query: string,
  ): Promise<SearchTweetDTO[]> {
    return this.searchService.searchTweets(query);
  }
}
