import { Injectable, BadRequestException } from '@nestjs/common';
import { GroupsService } from '../groups/groups.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class UsersGroupsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {}

  public async validateEntities(entities: string[]): Promise<void> {
    for (const entityId of entities) {
      const isUser = await this.usersService.isValidUser(entityId);
      const isGroup = await this.groupsService.isValidGroup(entityId);

      if (!isUser && !isGroup) {
        console.error(`Validation failed for entity ID: ${entityId}`);
        throw new BadRequestException(
          `Entity ID ${entityId} is neither a valid user nor a group.`,
        );
      }
    }
  }
}
