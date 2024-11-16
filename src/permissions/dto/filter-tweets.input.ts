import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class FilterTweetsInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  userId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  keyword?: string;
}
