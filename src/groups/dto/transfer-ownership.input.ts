import { InputType, Field } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class TransferOwnershipInput {
  @Field(() => String)
  @IsUUID()
  public groupId!: string;

  @Field(() => String)
  @IsUUID()
  public newOwnerId!: string;
}
