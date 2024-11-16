import { InputType } from '@nestjs/graphql';
import { BaseLoginInput } from './base-login.input';

@InputType()
export class UserLoginInput extends BaseLoginInput {}
