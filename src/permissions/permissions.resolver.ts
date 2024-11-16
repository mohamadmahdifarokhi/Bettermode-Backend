import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { PermissionsService } from './permissions.service';
import { UpdateTweetPermissionsInput } from './dto/update-tweet-permissions.input';
import { TweetPermissions } from './dto/tweet-permissions';
import { SetViewPermissionsInput } from './dto/set-view-permissions-input';

@Resolver()
export class PermissionsResolver {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Mutation(() => Boolean)
  public async updateTweetPermissions(
    @Args('input') input: UpdateTweetPermissionsInput,
  ): Promise<boolean> {
    return this.permissionsService.updateTweetPermissions(input);
  }

  @Mutation(() => Boolean)
  public async revokeEditPermission(
    @Args('tweetId') tweetId: string,
    @Args('userId') userId: string,
  ): Promise<boolean> {
    return this.permissionsService.revokeEditPermission(tweetId, userId);
  }

  @Mutation(() => Boolean)
  public async setViewPermissions(
    @Args('input') input: SetViewPermissionsInput,
  ): Promise<boolean> {
    const updateInput: UpdateTweetPermissionsInput = {
      tweetId: input.tweetId,
      inheritViewPermissions: input.inheritViewPermissions,
      inheritEditPermissions: input.inheritEditPermissions,
      viewPermissions: input.userIds,
      editPermissions: [],
    };

    return this.permissionsService.updateTweetPermissions(updateInput);
  }

  @Query(() => [TweetPermissions])
  public async tweetPermissions(
    @Args('tweetId') tweetId: string,
  ): Promise<TweetPermissions[]> {
    return this.permissionsService.getTweetPermissions(tweetId);
  }
}
