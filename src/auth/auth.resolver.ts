import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AdminLoginInput } from './dto/admin-login.input';
import { AuthPayload } from './dto/auth-payload.dto';
import { UnauthorizedException, Logger } from '@nestjs/common';
import { UserLoginInput } from './dto/user-login.input';

@Resolver()
export class AuthResolver {
  private readonly logger = new Logger(AuthResolver.name);

  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async adminLogin(
    @Args('input') input: AdminLoginInput,
  ): Promise<AuthPayload> {
    this.logger.debug(`Admin login attempt for username: ${input.username}`);
    const token = await this.authService.validateAdmin(
      input.username,
      input.password,
    );
    if (!token) {
      this.logger.warn(
        `Invalid admin credentials for username: ${input.username}`,
      );
      throw new UnauthorizedException('Invalid admin credentials');
    }
    this.logger.debug(`Admin login successful for username: ${input.username}`);
    return { token };
  }

  @Mutation(() => AuthPayload)
  async userLogin(@Args('input') input: UserLoginInput): Promise<AuthPayload> {
    this.logger.debug(`User login attempt for username: ${input.username}`);
    const token = await this.authService.validateUser(
      input.username,
      input.password,
    );
    if (!token) {
      this.logger.warn(
        `Invalid user credentials for username: ${input.username}`,
      );
      throw new UnauthorizedException('Invalid user credentials');
    }
    this.logger.debug(`User login successful for username: ${input.username}`);
    return { token };
  }
}
