import { registerEnumType } from '@nestjs/graphql';

export enum PermissionType {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  DELETE = 'DELETE',
}

registerEnumType(PermissionType, {
  name: 'PermissionType',
  description: 'Types of permissions available for tweets',
});
