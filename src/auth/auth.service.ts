import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateAdmin(username: string, password: string): Promise<string> {
    const normalizedUsername = username.toLowerCase();
    const user: User | null =
      await this.usersService.findByUsername(normalizedUsername);
    if (!user || !user.isAdmin) {
      this.logger.warn(`Admin validation failed for username: ${username}`);
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(
        `Invalid password attempt for admin username: ${username}`,
      );
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const payload = {
      username: user.username,
      sub: user.id,
      isAdmin: user.isAdmin,
    };
    const token = this.jwtService.sign(payload);
    this.logger.debug(`Admin user ${username} authenticated successfully.`);
    return token;
  }

  async validateUser(username: string, password: string): Promise<string> {
    const normalizedUsername = username.toLowerCase();

    const user: User | null =
      await this.usersService.findByUsername(normalizedUsername);

    if (!user) {
      this.logger.warn(`User validation failed for username: ${username}`);
      throw new UnauthorizedException('Invalid user credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(
        `Invalid password attempt for user username: ${username}`,
      );
      throw new UnauthorizedException('Invalid user credentials');
    }

    const payload = {
      username: user.username,
      sub: user.id,
    };
    const token = this.jwtService.sign(payload);
    this.logger.debug(`User ${username} authenticated successfully.`);
    return token;
  }
}
