import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsBoolean,
  IsArray,
  IsOptional,
  ArrayUnique,
  IsUUID,
} from 'class-validator';

@InputType()
export class UpdateTweetPermissionsInput {
  @Field(() => ID)
  @IsUUID()
  public tweetId!: string;

  @Field()
  @IsBoolean()
  public inheritViewPermissions!: boolean;

  @Field()
  @IsBoolean()
  public inheritEditPermissions!: boolean;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @ArrayUnique()
  @IsOptional()
  public viewPermissions?: string[];

  @Field(() => [String], { nullable: true })
  @IsArray()
  @ArrayUnique()
  @IsOptional()
  public editPermissions?: string[];
}
