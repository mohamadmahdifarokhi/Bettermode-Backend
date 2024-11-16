import { InputType, Field } from '@nestjs/graphql';
import {
  IsUUID,
  IsArray,
  ArrayUnique,
  IsOptional,
  IsString,
} from 'class-validator';

@InputType()
export class UpdateGroupInput {
  @Field(() => String)
  @IsUUID()
  public id!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  public name?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @IsOptional()
  public userIds?: string[];

  @Field(() => [String], { nullable: true })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @IsOptional()
  public groupIds?: string[];

  @Field(() => String, { nullable: true })
  @IsUUID()
  @IsOptional()
  public ownerId?: string;
}
