import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

interface JwtPayload {
  sub: string;
  username: string;
  isAdmin?: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables.');
      throw new Error('JWT_SECRET must be defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });

    this.logger = new Logger(JwtStrategy.name);
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      this.logger.warn(
        `JWT validation failed: user with ID ${payload.sub} not found.`,
      );
      throw new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
