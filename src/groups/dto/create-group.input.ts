import { InputType, Field } from '@nestjs/graphql';
import {
  IsUUID,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsOptional,
  IsString,
} from 'class-validator';

@InputType()
export class CreateGroupInput {
  @Field()
  @IsString()
  public name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => [String])
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  public userIds!: string[];

  @Field(() => String, { nullable: true })
  @IsUUID()
  @IsOptional()
  public ownerId?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @IsOptional()
  public groupIds?: string[];
}
