import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TweetPermissions {
  @Field()
  userId!: string;

  @Field()
  canEdit!: boolean;

  @Field()
  canView!: boolean;
}
