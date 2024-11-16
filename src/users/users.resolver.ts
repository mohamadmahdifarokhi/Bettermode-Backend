import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { NotFoundException } from '@nestjs/common';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  public async createUser(
    @Args('input') input: CreateUserInput,
  ): Promise<User> {
    return this.usersService.createUser(input);
  }

  @Mutation(() => Boolean)
  public async deleteUser(@Args('id') id: string): Promise<boolean> {
    return this.usersService.delete(id);
  }

  @Query(() => User, { name: 'user' })
  public async getUser(@Args('id') id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Query(() => [User], { name: 'users' })
  public async getUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'findUserByUsername' })
  public async findUserByUsername(
    @Args('username') username: string,
  ): Promise<User> {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    return user;
  }

  @Query(() => User, { name: 'findUserByEmail' })
  public async findUserByEmail(@Args('email') email: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }
}
