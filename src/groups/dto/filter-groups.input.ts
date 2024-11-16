import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsArray, ArrayUnique, IsOptional } from 'class-validator';

@InputType()
export class FilterGroupsInput {
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
}
