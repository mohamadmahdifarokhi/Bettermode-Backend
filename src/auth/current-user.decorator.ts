import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../users/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (
    data: keyof User | undefined,
    context: ExecutionContext,
  ): Partial<User> | User | null => {
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;
    if (!user) {
      return null;
    }
    return data ? user[data] : user;
  },
);
