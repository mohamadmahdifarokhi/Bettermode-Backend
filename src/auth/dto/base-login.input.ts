import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType({ isAbstract: true })
export class BaseLoginInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  username!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  password!: string;
}
