import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AuthPayload {
  @Field()
  token!: string;

  @Field(() => String, { nullable: true })
  expiresAt?: string;
}
