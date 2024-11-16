import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm';
import { UpdateTweetPermissionsInput } from './dto/update-tweet-permissions.input';
import { PermissionType } from './entities/permission-type.enum';
import { Inject, forwardRef } from '@nestjs/common';
import { TweetsService } from '../tweets/tweets.service';
import { UsersGroupsService } from '../shared/users-groups.service';
import { TweetPermissions } from './dto/tweet-permissions';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    private readonly usersGroupsService: UsersGroupsService,
    @Inject(forwardRef(() => TweetsService))
    private readonly tweetsService: TweetsService,
  ) {}

  public async updateTweetPermissions(
    input: UpdateTweetPermissionsInput,
  ): Promise<boolean> {
    const {
      tweetId,
      inheritViewPermissions,
      inheritEditPermissions,
      viewPermissions,
      editPermissions,
    } = input;

    const tweet = await this.tweetsService.findById(tweetId);
    if (!tweet) {
      throw new NotFoundException(`Tweet with ID ${tweetId} not found.`);
    }

    if (viewPermissions && viewPermissions.length > 0) {
      await this.usersGroupsService.validateEntities(viewPermissions);
    }
    if (editPermissions && editPermissions.length > 0) {
      await this.usersGroupsService.validateEntities(editPermissions);
    }

    if (
      inheritViewPermissions &&
      (!viewPermissions || viewPermissions.length === 0)
    ) {
      await this.permissionsRepository.delete({
        tweetId: tweetId,
        type: PermissionType.VIEW,
      });
    } else if (viewPermissions && viewPermissions.length > 0) {
      await this.permissionsRepository.delete({
        tweetId: tweetId,
        type: PermissionType.VIEW,
      });

      const viewPermEntities = this.permissionsRepository.create(
        viewPermissions.map((entityId) => ({
          tweet: tweet,
          type: PermissionType.VIEW,
          entities: [entityId],
          inherit: false,
        })),
      );

      await this.permissionsRepository.save(viewPermEntities);
    }

    if (
      inheritEditPermissions &&
      (!editPermissions || editPermissions.length === 0)
    ) {
      await this.permissionsRepository.delete({
        tweetId: tweetId,
        type: PermissionType.EDIT,
      });
    } else if (editPermissions && editPermissions.length > 0) {
      await this.permissionsRepository.delete({
        tweetId: tweetId,
        type: PermissionType.EDIT,
      });

      const editPermEntities = this.permissionsRepository.create(
        editPermissions.map((entityId) => ({
          tweet: tweet,
          type: PermissionType.EDIT,
          entities: [entityId],
          inherit: false,
        })),
      );

      await this.permissionsRepository.save(editPermEntities);
    }

    return true;
  }

  public async revokeEditPermission(
    tweetId: string,
    userId: string,
  ): Promise<boolean> {
    const permission = await this.permissionsRepository
      .createQueryBuilder('permission')
      .where('permission.tweetId = :tweetId', { tweetId })
      .andWhere('permission.type = :type', { type: PermissionType.EDIT })
      .andWhere(':userId = ANY(permission.entities)', { userId })
      .getOne();

    if (!permission) {
      throw new NotFoundException(
        `Edit permission for user with ID ${userId} on tweet with ID ${tweetId} not found.`,
      );
    }

    permission.entities = (permission.entities || []).filter(
      (entity) => entity !== userId,
    );

    if (permission.entities.length === 0) {
      await this.permissionsRepository.delete({ id: permission.id });
    } else {
      await this.permissionsRepository.save(permission);
    }

    return true;
  }

  public async getTweetPermissions(
    tweetId: string,
  ): Promise<TweetPermissions[]> {
    const mergedPermissions: Record<string, TweetPermissions> = {};
    let currentTweet = await this.tweetsService.findById(tweetId);

    while (currentTweet) {
      const permissions = await this.permissionsRepository.find({
        where: { tweetId: currentTweet.id },
      });

      permissions.forEach((permission) => {
        (permission.entities || []).forEach((entity) => {
          if (!mergedPermissions[entity]) {
            mergedPermissions[entity] = {
              userId: entity,
              canEdit: false,
              canView: false,
            };
          }
          if (permission.type === PermissionType.EDIT) {
            mergedPermissions[entity].canEdit = true;
          }
          if (permission.type === PermissionType.VIEW) {
            mergedPermissions[entity].canView = true;
          }
        });
      });

      if (!currentTweet.parentTweet) {
        break;
      }
      currentTweet = await this.tweetsService.findById(
        currentTweet.parentTweet.id,
      );
    }

    return Object.values(mergedPermissions);
  }
}
