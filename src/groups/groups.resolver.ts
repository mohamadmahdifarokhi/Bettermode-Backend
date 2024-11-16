import { Resolver, Mutation, Args, Query, Int } from '@nestjs/graphql';
import { GroupsService } from './groups.service';
import { Group } from './entities/group.entity';
import { CreateGroupInput } from './dto/create-group.input';
import { FilterGroupsInput } from './dto/filter-groups.input';
import { UpdateGroupInput } from './dto/update-group.input';
import { DeleteGroupInput } from './dto/delete-group.input';
import { TransferOwnershipInput } from './dto/transfer-ownership.input';
import { PaginatedGroups } from './dto/paginated-groups.dto';
import { AddUserToGroupInput } from './dto/add-user-to-group.input';
import {
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Group)
export class GroupsResolver {
  constructor(private readonly groupsService: GroupsService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Group)
  async createGroup(@Args('input') input: CreateGroupInput): Promise<Group> {
    return this.groupsService.create(input);
  }

  @Query(() => Group, { name: 'group' })
  @UseGuards(GqlAuthGuard)
  public async getGroup(@Args('name') name: string): Promise<Group> {
    const group = await this.groupsService.findByName(name);

    if (!group) {
      throw new NotFoundException(`Group with name "${name}" not found`);
    }
    return group;
  }

  @Query(() => PaginatedGroups, { name: 'paginatedGroups' })
  @UseGuards(GqlAuthGuard)
  public async getPaginatedGroups(
    @Args('filter', { type: () => FilterGroupsInput, nullable: true })
    filter?: FilterGroupsInput,
    @Args('limit', { type: () => Int, defaultValue: 10 })
    limit = 10,
    @Args('cursor', { type: () => String, nullable: true })
    cursor?: string,
  ): Promise<PaginatedGroups> {
    return this.groupsService.paginate(filter || {}, limit, cursor);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Group)
  public async updateGroup(
    @Args('input') input: UpdateGroupInput,
    @CurrentUser() user: User,
  ): Promise<Group> {
    const group = await this.groupsService.findById(input.id);
    if (group.owner.id !== user.id) {
      throw new ForbiddenException('You are not the owner of this group');
    }
    return this.groupsService.update(input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  public async deleteGroup(
    @Args('input') input: DeleteGroupInput,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    const group = await this.groupsService.findById(input.id);
    if (group.owner.id !== user.id) {
      throw new ForbiddenException('You are not the owner of this group');
    }
    await this.groupsService.delete(input.id);
    return true;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Group)
  public async transferGroupOwnership(
    @Args('input') input: TransferOwnershipInput,
    @CurrentUser() user: User,
  ): Promise<Group> {
    const group = await this.groupsService.findById(input.groupId);
    if (group.owner.id !== user.id) {
      throw new ForbiddenException('You are not the owner of this group');
    }
    return this.groupsService.transferOwnership(input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Group)
  public async addUserToGroup(
    @Args('input') input: AddUserToGroupInput,
    @CurrentUser() user: User,
  ): Promise<Group> {
    const group = await this.groupsService.findById(input.groupId);

    if (group.owner.id !== user.id) {
      throw new ForbiddenException('You are not the owner of this group');
    }
    return this.groupsService.addUserToGroup(input);
  }
}
