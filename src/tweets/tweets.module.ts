import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TweetsService } from './tweets.service';
import { TweetsResolver } from './tweets.resolver';
import { Tweet } from './entities/tweet.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Group } from '../groups/entities/group.entity';
import { UsersModule } from '../users/users.module';
import { GroupsModule } from '../groups/groups.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { MessagingModule } from '../messaging/messaging.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tweet, Permission, Group]),
    UsersModule,
    forwardRef(() => GroupsModule),
    PermissionsModule,
    MessagingModule,
    CommonModule,
  ],
  providers: [TweetsService, TweetsResolver],
  exports: [TweetsService],
})
export class TweetsModule {}
