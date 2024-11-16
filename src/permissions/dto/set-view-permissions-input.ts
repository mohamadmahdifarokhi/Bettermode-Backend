import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsArray, IsBoolean } from 'class-validator';

@InputType()
export class SetViewPermissionsInput {
  @Field(() => ID)
  @IsUUID()
  public tweetId!: string;

  @Field(() => [ID])
  @IsArray()
  public userIds!: string[];

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  public inheritViewPermissions!: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  public inheritEditPermissions!: boolean;
}
