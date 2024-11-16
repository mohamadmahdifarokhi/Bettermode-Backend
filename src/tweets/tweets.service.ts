import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  In,
  DeepPartial,
  SelectQueryBuilder,
  ILike,
  DataSource,
  Brackets,
} from 'typeorm';
import { Tweet } from './entities/tweet.entity';
import { CreateTweetInput } from './dto/create-tweet.input';
import { UpdateTweetPermissionsInput } from '../permissions/dto/update-tweet-permissions.input';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { Permission, PermissionType } from '../permissions/entities';
import { PaginatedTweet } from './models/paginated-tweet.model';
import { MessagingService } from '../messaging/messaging.service';
import { Group } from '../groups/entities/group.entity';
import { FilterTweetsInput } from './dto/filter-tweets.input';
import { User } from 'src/users/entities/user.entity';
import { LoggerService } from '../common/logger.service';
import { APP_LOGGER } from '../common/constants';
import { AddUserToGroupInput } from '../groups/dto/add-user-to-group.input';

@Injectable()
export class TweetsService {
  constructor(
    @InjectRepository(Tweet)
    private readonly tweetsRepository: Repository<Tweet>,
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    private readonly usersService: UsersService,
    private readonly messagingService: MessagingService,
    private readonly groupsService: GroupsService,
    private readonly dataSource: DataSource,
    @Inject(APP_LOGGER) private readonly logger: LoggerService,
  ) {}

  public async createTweet(input: CreateTweetInput): Promise<Tweet> {
    this.logger.log(
      `Creating tweet with content: ${input.content}`,
      'TweetsService',
    );

    return await this.dataSource.transaction(async (manager) => {
      const { authorId, parentTweetId, ...rest } = input;

      const author = await this.usersService.findById(authorId);
      if (!author) {
        throw new NotFoundException(`User with ID ${authorId} not found.`);
      }

      let parentTweet: Tweet | null = null;
      if (parentTweetId) {
        parentTweet = await manager.findOne(Tweet, {
          where: { id: parentTweetId },
        });
        if (!parentTweet) {
          throw new NotFoundException(
            `Parent tweet with ID ${parentTweetId} not found`,
          );
        }
      }

      const tweetData: DeepPartial<Tweet> = {
        ...rest,
        author,
        ...(parentTweet ? { parentTweet } : {}),
      };

      const tweet: Tweet = manager.create(Tweet, tweetData);

      const savedTweet: Tweet = await manager.save(tweet);

      const viewPermission = manager.create(Permission, {
        tweet: savedTweet,
        type: PermissionType.VIEW,
        entities: [],
        inherit: !!parentTweet,
      });
      await manager.save(viewPermission);

      const editPermission = manager.create(Permission, {
        tweet: savedTweet,
        type: PermissionType.EDIT,
        entities: [],
        inherit: !!parentTweet,
      });

      await manager.save([viewPermission, editPermission]);

      try {
        await this.messagingService.publishTweetCreated(savedTweet);
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(
            `Failed to publish TweetCreated event for tweet ${savedTweet.id}: ${error.message}`,
            'TweetsService',
          );
        } else {
          this.logger.error(
            `Failed to publish TweetCreated event for tweet ${savedTweet.id}: Unknown error`,
            'TweetsService',
          );
        }
      }

      return savedTweet;
    });
  }

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

    const tweet = await this.tweetsRepository.findOne({
      where: { id: tweetId },
      relations: ['parentTweet', 'permissions'],
    });
    if (!tweet) {
      throw new NotFoundException(`Tweet with ID ${tweetId} not found`);
    }

    const viewPermission = tweet.permissions.find(
      (p) => p.type === PermissionType.VIEW,
    );
    if (!viewPermission) {
      throw new NotFoundException('View permission not found');
    }

    viewPermission.inherit = inheritViewPermissions;
    if (!inheritViewPermissions) {
      if (!viewPermissions || viewPermissions.length === 0) {
        throw new BadRequestException(
          'viewPermissions must be provided if inheritViewPermissions is false',
        );
      }
      const validEntities = await this.validateEntities(viewPermissions);
      viewPermission.entities = validEntities;
    } else {
      viewPermission.entities = [];
    }

    const editPermission = tweet.permissions.find(
      (p) => p.type === PermissionType.EDIT,
    );
    if (!editPermission) {
      throw new NotFoundException('Edit permission not found');
    }

    editPermission.inherit = inheritEditPermissions;
    if (!inheritEditPermissions) {
      if (!editPermissions || editPermissions.length === 0) {
        throw new BadRequestException(
          'editPermissions must be provided if inheritEditPermissions is false',
        );
      }
      const validEntities = await this.validateEntities(editPermissions);
      editPermission.entities = validEntities;
    } else {
      editPermission.entities = [];
    }

    await this.permissionsRepository.save([viewPermission, editPermission]);

    try {
      await this.messagingService.publishTweetUpdated(tweet);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to publish TweetUpdated event for tweet ${tweet.id}: ${error.message}`,
          'TweetsService',
        );
      } else {
        this.logger.error(
          `Failed to publish TweetUpdated event for tweet ${tweet.id}: Unknown error`,
          'TweetsService',
        );
      }
    }

    return true;
  }

  private async validateEntities(entities: string[]): Promise<string[]> {
    const userIds: string[] = [];
    const groupIds: string[] = [];

    for (const entityId of entities) {
      if (this.isUUID(entityId)) {
        const isUser = await this.usersService.exists(entityId);
        const isGroup = await this.groupsService.isValidGroup(entityId);

        if (isUser) {
          userIds.push(entityId);
        } else if (isGroup) {
          groupIds.push(entityId);
        } else {
          throw new BadRequestException(`Invalid entity ID: ${entityId}`);
        }
      } else {
        throw new BadRequestException(`Invalid entity ID format: ${entityId}`);
      }
    }

    const validEntities = [...userIds, ...groupIds];
    return validEntities;
  }

  private isUUID(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  public async paginateTweets(
    limit: number,
    page: number,
    filter?: FilterTweetsInput,
  ): Promise<PaginatedTweet> {
    const validatedLimit = Math.min(limit, 100);
    const offset = (page - 1) * validatedLimit;

    const query = this.tweetsRepository
      .createQueryBuilder('tweet')
      .leftJoinAndSelect('tweet.author', 'author')
      .leftJoinAndSelect('tweet.parentTweet', 'parentTweet')
      .leftJoinAndSelect('tweet.permissions', 'permissions');

    if (filter) {
      if (filter.userId) {
        const userGroups = await this.getAllGroupsForUser(filter.userId);
        const userGroupIds = userGroups.map((group) => group.id);

        query.andWhere(
          new Brackets((qb) => {
            qb.where('permissions.type = :viewPermissionType', {
              viewPermissionType: PermissionType.VIEW,
            }).andWhere(
              new Brackets((qb2) => {
                qb2
                  .where('permissions.entities @> ARRAY[:userId]::uuid[]', {
                    userId: filter.userId,
                  })
                  .orWhere(
                    'permissions.entities && ARRAY[:...groupIds]::uuid[]',
                    { groupIds: userGroupIds },
                  );
              }),
            );
          }),
        );
      }

      if (filter.keyword) {
        query.andWhere('tweet.content ILIKE :keyword', {
          keyword: `%${filter.keyword}%`,
        });
      }
    }

    query
      .orderBy('tweet.createdAt', 'DESC')
      .take(validatedLimit + 1)
      .skip(offset);

    const tweets = await query.getMany();

    const hasNextPage = tweets.length > validatedLimit;
    if (hasNextPage) {
      tweets.pop();
    }

    return {
      nodes: tweets,
      hasNextPage,
    };
  }

  public async addUserToGroup(input: AddUserToGroupInput): Promise<Group> {
    const { groupId, userId } = input;

    const group = await this.groupsService.findById(groupId);
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const isAlreadyMember = group.members.some(
      (member) => member.id === userId,
    );
    if (isAlreadyMember) {
      throw new BadRequestException('User is already a member of the group');
    }

    group.members.push(user);

    await this.groupsRepository.save(group);

    const updatedGroup = await this.groupsService.findById(groupId);

    return updatedGroup;
  }

  private async isCircularDependency(
    parentId: string,
    childGroupIds: string[],
  ): Promise<boolean> {
    const visited = new Set<string>();
    const stack = [...childGroupIds];

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (!currentId) continue;

      if (currentId === parentId) {
        return true;
      }

      if (visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);

      const currentGroup = await this.groupsRepository.findOne({
        where: { id: currentId },
        relations: ['subgroups'],
      });

      if (currentGroup && currentGroup.subgroups.length > 0) {
        const nestedGroupIds = currentGroup.subgroups.map((g) => g.id);
        stack.push(...nestedGroupIds);
      }
    }

    return false;
  }

  public async isValidGroup(groupId: string): Promise<boolean> {
    const count = await this.groupsRepository.count({ where: { id: groupId } });
    return count > 0;
  }

  public async findById(id: string): Promise<Tweet> {
    const tweet: Tweet | null = await this.tweetsRepository.findOne({
      where: { id },
      relations: ['author', 'permissions', 'parentTweet', 'replies'],
    });
    if (!tweet) {
      throw new NotFoundException(`Tweet with ID ${id} not found.`);
    }
    return tweet;
  }

  public async isValidUser(userId: string): Promise<boolean> {
    try {
      const user: User = await this.usersService.findById(userId);
      return !!user;
    } catch {
      return false;
    }
  }

  public async findAll(filter?: FilterTweetsInput): Promise<Tweet[]> {
    const query: SelectQueryBuilder<Tweet> = this.tweetsRepository
      .createQueryBuilder('tweet')
      .leftJoinAndSelect('tweet.author', 'author')
      .leftJoinAndSelect('tweet.permissions', 'permissions')
      .leftJoinAndSelect('tweet.parentTweet', 'parentTweet')
      .leftJoinAndSelect('tweet.replies', 'replies');

    if (filter) {
      if (filter.userId) {
        query.andWhere('author.id = :authorId', { authorId: filter.userId });
      }

      if (filter.keyword) {
        query.andWhere('tweet.content ILIKE :keyword', {
          keyword: `%${filter.keyword}%`,
        });
      }
    }

    return query.getMany();
  }

  public async findByAuthor(userId: string): Promise<Tweet[]> {
    return this.tweetsRepository.find({
      where: { author: { id: userId } },
      relations: ['author', 'permissions'],
    });
  }

  public async findByContent(content: string): Promise<Tweet[]> {
    return this.tweetsRepository.find({
      where: {
        content: ILike(`%${content}%`),
      },
      relations: ['author', 'permissions'],
    });
  }

  public async handlePermissionInheritance(tweetId: string): Promise<void> {
    const childTweets = await this.tweetsRepository.find({
      where: { parentTweet: { id: tweetId } },
      relations: ['permissions', 'parentTweet'],
    });

    for (const childTweet of childTweets) {
      const viewPermission: Permission | undefined =
        childTweet.permissions.find((p) => p.type === PermissionType.VIEW);
      const editPermission: Permission | undefined =
        childTweet.permissions.find((p) => p.type === PermissionType.EDIT);

      let needsUpdate = false;

      if (viewPermission && viewPermission.inherit && childTweet.parentTweet) {
        const parentViewPermission: Permission | undefined =
          childTweet.parentTweet.permissions.find(
            (p) => p.type === PermissionType.VIEW,
          );
        if (parentViewPermission) {
          viewPermission.entities = parentViewPermission.entities ?? [];
          needsUpdate = true;
        }
      }

      if (editPermission && editPermission.inherit && childTweet.parentTweet) {
        const parentEditPermission: Permission | undefined =
          childTweet.parentTweet.permissions.find(
            (p) => p.type === PermissionType.EDIT,
          );
        if (parentEditPermission) {
          editPermission.entities = parentEditPermission.entities ?? [];
          needsUpdate = true;
        }
      }

      const permissionsToSave: Permission[] = [
        viewPermission,
        editPermission,
      ].filter(
        (permission): permission is Permission => permission !== undefined,
      );

      if (permissionsToSave.length > 0 && needsUpdate) {
        await this.permissionsRepository.save(permissionsToSave);
        await this.messagingService.publishTweetUpdated(childTweet);
      }
    }
  }

  public async getAllGroupsForUser(userId: string): Promise<Group[]> {
    const directGroups = await this.groupsService.findByUserId(userId);
    const allGroups: Set<string> = new Set<string>();
    for (const group of directGroups) {
      await this.collectGroups(group, allGroups);
    }

    const groups: Group[] = await this.groupsRepository.find({
      where: { id: In(Array.from(allGroups)) },
      relations: ['subgroups'],
    });

    return groups;
  }

  private async collectGroups(
    group: Group,
    allGroups: Set<string>,
  ): Promise<void> {
    if (allGroups.has(group.id)) return;
    allGroups.add(group.id);
    if (group.subgroups && group.subgroups.length > 0) {
      for (const subgroup of group.subgroups) {
        await this.collectGroups(subgroup, allGroups);
      }
    }
  }

  public async canUserViewTweet(
    userId: string,
    userGroups: Group[],
    tweet: Tweet,
    visitedTweets: Set<string> = new Set(),
  ): Promise<boolean> {
    if (visitedTweets.has(tweet.id)) return false;
    visitedTweets.add(tweet.id);

    const viewPermission = await this.permissionsRepository.findOne({
      where: { tweet: { id: tweet.id }, type: PermissionType.VIEW },
    });
    if (!viewPermission) return false;

    if (viewPermission.inherit && tweet.parentTweet) {
      const parentTweet = await this.tweetsRepository.findOne({
        where: { id: tweet.parentTweet.id },
        relations: ['parentTweet'],
      });
      if (parentTweet) {
        return this.canUserViewTweet(
          userId,
          userGroups,
          parentTweet,
          visitedTweets,
        );
      }
      return false;
    }

    if (viewPermission.inherit && !tweet.parentTweet) {
      return true;
    }

    if (viewPermission.entities?.includes(userId)) return true;

    const userGroupIds = userGroups.map((group) => group.id);
    for (const groupId of userGroupIds) {
      if (viewPermission.entities?.includes(groupId)) return true;
    }

    return false;
  }

  public async canEditTweet(userId: string, tweetId: string): Promise<boolean> {
    const tweet = await this.tweetsRepository.findOne({
      where: { id: tweetId },
      relations: ['author', 'parentTweet', 'permissions'],
    });
    if (!tweet) {
      throw new NotFoundException(`Tweet with ID ${tweetId} not found`);
    }

    if (tweet.author.id === userId) return true;

    const userGroups: Group[] = await this.getAllGroupsForUser(userId);
    const userGroupIds: string[] = userGroups.map((group) => group.id);

    return this.canUserEditTweetRecursive(userId, userGroupIds, tweet);
  }

  private async canUserEditTweetRecursive(
    userId: string,
    userGroupIds: string[],
    tweet: Tweet,
    visitedTweets: Set<string> = new Set(),
  ): Promise<boolean> {
    if (visitedTweets.has(tweet.id)) return false;
    visitedTweets.add(tweet.id);

    const editPermission = await this.permissionsRepository.findOne({
      where: { tweet: { id: tweet.id }, type: PermissionType.EDIT },
    });
    if (!editPermission) return false;

    if (editPermission.inherit && tweet.parentTweet) {
      const parentTweet = await this.tweetsRepository.findOne({
        where: { id: tweet.parentTweet.id },
        relations: ['parentTweet'],
      });
      if (parentTweet) {
        return this.canUserEditTweetRecursive(
          userId,
          userGroupIds,
          parentTweet,
          visitedTweets,
        );
      }
      return false;
    }

    if (editPermission.inherit && !tweet.parentTweet) {
      return false;
    }

    if (editPermission.entities?.includes(userId)) return true;

    for (const groupId of userGroupIds) {
      if (editPermission.entities?.includes(groupId)) return true;
    }

    return false;
  }
}
