import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Repository, In, DataSource } from 'typeorm';
import { CreateGroupInput } from './dto/create-group.input';
import { UpdateGroupInput } from './dto/update-group.input';
import { TransferOwnershipInput } from './dto/transfer-ownership.input';
import { FilterGroupsInput } from './dto/filter-groups.input';
import { AddUserToGroupInput } from './dto/add-user-to-group.input';
import { UsersService } from '../users/users.service';
import { PaginatedGroups } from './dto/paginated-groups.dto';
import { LoggerService } from '../common/logger.service';
import { APP_LOGGER } from '../common/constants';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    @Inject(APP_LOGGER) private readonly logger: LoggerService,
  ) {}

  async findByName(name: string): Promise<Group | null> {
    return this.groupsRepository.findOne({
      where: { name },
      relations: ['members', 'subgroups', 'owner'],
    });
  }

  public async create(createGroupInput: CreateGroupInput): Promise<Group> {
    this.logger.log(
      `Creating group with name: ${createGroupInput.name}`,
      'GroupsService',
    );

    return await this.dataSource.transaction(async (manager) => {
      const { name, userIds, groupIds, ownerId } = createGroupInput;

      const existingGroup = await this.groupsRepository.findOne({
        where: { name },
      });

      if (existingGroup) {
        throw new BadRequestException(
          `A group with the name "${name}" already exists.`,
        );
      }

      const owner = ownerId
        ? await this.usersService.findById(ownerId)
        : await this.usersService.findById(userIds[0]);

      if (!owner) {
        throw new BadRequestException('Invalid ownerId provided.');
      }

      const users = userIds ? await this.usersService.findByIds(userIds) : [];
      if (users.length !== (userIds ? userIds.length : 0)) {
        throw new BadRequestException('One or more userIds are invalid');
      }

      const groups =
        groupIds && groupIds.length > 0 ? await this.findByIds(groupIds) : [];
      if (groups.length !== (groupIds ? groupIds.length : 0)) {
        throw new BadRequestException('One or more groupIds are invalid');
      }

      for (const group of groups) {
        if (await this.isCircularDependency(group.id, groupIds || [])) {
          throw new BadRequestException('Circular group dependency detected');
        }
      }

      const group = manager.create(Group, {
        name,
        owner,
        members: users,
        subgroups: groups,
      });

      const savedGroup = await manager.save(group);

      const fullGroup = await manager.findOne(Group, {
        where: { id: savedGroup.id },
        relations: ['members', 'subgroups', 'owner'],
      });

      if (!fullGroup) {
        throw new NotFoundException(
          `Group with ID ${savedGroup.id} not found after creation.`,
        );
      }

      return fullGroup;
    });
  }

  public async findById(id: string): Promise<Group> {
    const group = await this.groupsRepository.findOne({
      where: { id },
      relations: ['owner', 'members', 'subgroups'],
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  public async findByIds(ids: string[]): Promise<Group[]> {
    return this.groupsRepository.find({
      where: { id: In(ids) },
      relations: ['owner', 'members', 'subgroups'],
    });
  }

  public async findAll(): Promise<Group[]> {
    return this.groupsRepository.find({
      relations: ['owner', 'members', 'subgroups'],
    });
  }

  public async update(updateGroupInput: UpdateGroupInput): Promise<Group> {
    const { id, name, userIds, groupIds, ownerId } = updateGroupInput;

    const group = await this.findById(id);

    if (name !== undefined) {
      group.name = name;
    }

    if (ownerId !== undefined) {
      const newOwner = await this.usersService.findById(ownerId);
      if (!newOwner) {
        throw new BadRequestException('Invalid ownerId provided.');
      }
      group.owner = newOwner;
    }

    if (userIds !== undefined) {
      const users = await this.usersService.findByIds(userIds);
      if (users.length !== userIds.length) {
        throw new BadRequestException('One or more userIds are invalid');
      }
      group.members = users;
    }

    if (groupIds !== undefined) {
      const groups = await this.findByIds(groupIds);
      if (groups.length !== groupIds.length) {
        throw new BadRequestException('One or more groupIds are invalid');
      }

      for (const childGroup of groups) {
        if (await this.isCircularDependency(childGroup.id, groupIds || [])) {
          throw new BadRequestException('Circular group dependency detected');
        }
      }

      group.subgroups = groups;
    }

    return this.groupsRepository.save(group);
  }

  public async delete(id: string): Promise<void> {
    this.logger.log(`Deleting group with ID: ${id}`, 'GroupsService');
    const result = await this.groupsRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Group with ID ${id} not found for deletion`);
    }
  }

  public async transferOwnership(
    transferOwnershipInput: TransferOwnershipInput,
  ): Promise<Group> {
    const { groupId, newOwnerId } = transferOwnershipInput;
    const group = await this.findById(groupId);
    const newOwner = await this.usersService.findById(newOwnerId);

    if (!newOwner) {
      throw new BadRequestException('Invalid newOwnerId provided.');
    }

    group.owner = newOwner;
    this.logger.log(
      `Transferred ownership of group ${groupId} to user ${newOwnerId}`,
      'GroupsService',
    );

    return this.groupsRepository.save(group);
  }

  public async paginate(
    filter: FilterGroupsInput,
    limit: number,
    cursor?: string,
  ): Promise<PaginatedGroups> {
    const validatedLimit = Math.min(limit, 100);
    const query = this.groupsRepository.createQueryBuilder('group');

    if (filter.userIds && filter.userIds.length > 0) {
      query
        .leftJoin('group.members', 'user')
        .andWhere('user.id IN (:...userIds)', { userIds: filter.userIds });
    }

    if (filter.groupIds && filter.groupIds.length > 0) {
      query
        .leftJoin('group.subgroups', 'subgroup')
        .andWhere('subgroup.id IN (:...groupIds)', {
          groupIds: filter.groupIds,
        });
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (isNaN(cursorDate.getTime())) {
        throw new BadRequestException('Invalid cursor format');
      }
      query.andWhere('group.createdAt < :cursorDate', { cursorDate });
    }

    query.orderBy('group.createdAt', 'DESC').take(validatedLimit + 1);

    const groups = await query.getMany();

    const hasNextPage = groups.length > validatedLimit;
    if (hasNextPage) {
      groups.pop();
    }

    return {
      nodes: groups,
      hasNextPage,
    };
  }

  public async addUserToGroup(input: AddUserToGroupInput): Promise<Group> {
    const { groupId, userId } = input;

    const group = await this.findById(groupId);
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

    const updatedGroup = await this.findById(groupId);

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

  public async findByUserId(userId: string): Promise<Group[]> {
    const groups = await this.groupsRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.members', 'user')
      .where('user.id = :userId', { userId })
      .getMany();

    return groups;
  }
}
