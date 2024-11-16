import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class SendMessageInput {
  @Field()
  senderId!: string;

  @Field()
  receiverId!: string;

  @Field()
  content!: string;
}
