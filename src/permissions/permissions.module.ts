import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsService } from './permissions.service';
import { PermissionsResolver } from './permissions.resolver';
import { Permission } from './entities/permission.entity';
import { UsersModule } from '../users/users.module';
import { GroupsModule } from '../groups/groups.module';
import { TweetsModule } from '../tweets/tweets.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission]),
    forwardRef(() => UsersModule),
    forwardRef(() => GroupsModule),
    forwardRef(() => TweetsModule),
    forwardRef(() => SharedModule),
  ],
  providers: [PermissionsService, PermissionsResolver],
  exports: [PermissionsService],
})
export class PermissionsModule {}
