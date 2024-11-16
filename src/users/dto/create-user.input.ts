import { InputType, Field } from '@nestjs/graphql';
import { IsBoolean, IsEmail, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  public name!: string;

  @Field()
  @IsEmail()
  public email!: string;

  @Field()
  @IsString()
  public username!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  public password!: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  public isAdmin?: boolean;
}
