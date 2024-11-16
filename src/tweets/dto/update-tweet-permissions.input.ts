import { InputType, Field } from '@nestjs/graphql';
import {
  IsUUID,
  IsBoolean,
  IsArray,
  ArrayUnique,
  IsOptional,
} from 'class-validator';

@InputType()
export class UpdateTweetPermissionsInput {
  @Field(() => String)
  @IsUUID()
  public tweetId!: string;

  @Field(() => Boolean)
  @IsBoolean()
  public inheritViewPermissions!: boolean;

  @Field(() => Boolean)
  @IsBoolean()
  public inheritEditPermissions!: boolean;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @IsOptional()
  public viewPermissions?: string[];

  @Field(() => [String], { nullable: true })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @IsOptional()
  public editPermissions?: string[];
}
