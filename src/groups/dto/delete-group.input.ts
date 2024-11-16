import { InputType, Field } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class DeleteGroupInput {
  @Field(() => String)
  @IsUUID()
  public id!: string;
}
