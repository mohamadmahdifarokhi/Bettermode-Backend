import { forwardRef, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { GroupsModule } from '../groups/groups.module';
import { UsersGroupsService } from './users-groups.service';

@Module({
  imports: [forwardRef(() => UsersModule), forwardRef(() => GroupsModule)],
  providers: [UsersGroupsService],
  exports: [UsersGroupsService],
})
export class SharedModule {}
