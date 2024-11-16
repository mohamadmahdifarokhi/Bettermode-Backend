import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { TweetCategory } from '../entities/tweet-category.enum';

@InputType()
export class CreateTweetInput {
  @Field()
  @IsUUID()
  public authorId!: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  public parentTweetId?: string;

  @Field()
  @IsString()
  public content!: string;

  @Field(() => [String], { nullable: 'itemsAndList' })
  @IsArray()
  @IsOptional()
  public hashtags?: string[];

  @Field(() => TweetCategory, { nullable: true })
  @IsEnum(TweetCategory)
  @IsOptional()
  public category?: TweetCategory;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  public location?: string;
}
