import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsService } from './groups.service';
import { GroupsResolver } from './groups.resolver';
import { Group } from './entities/group.entity';
import { UsersModule } from '../users/users.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group]),
    forwardRef(() => UsersModule),
    forwardRef(() => PermissionsModule),
    forwardRef(() => MessagingModule),
  ],
  providers: [GroupsService, GroupsResolver],
  exports: [GroupsService],
})
export class GroupsModule {}
