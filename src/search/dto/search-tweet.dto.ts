import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class SearchTweetDTO {
  @Field(() => ID)
  id!: string;

  @Field()
  content!: string;

  @Field(() => [String])
  hashtags!: string[];

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  location?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
