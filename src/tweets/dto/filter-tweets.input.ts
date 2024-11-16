import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class FilterTweetsInput {
  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  public userId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  public keyword?: string;
}
