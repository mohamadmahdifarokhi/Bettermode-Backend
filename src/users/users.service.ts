import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, In, DeleteResult } from 'typeorm';
import { CreateUserInput } from './dto/create-user.input';
import { Group } from '../groups/entities/group.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
  ) {}

  public async create(createUserInput: CreateUserInput): Promise<User> {
    if (!createUserInput.password) {
      throw new BadRequestException('Password is required');
    }
    const passwordHash = await bcrypt.hash(createUserInput.password, 10);
    const newUser = this.usersRepository.create({
      ...createUserInput,
      password: passwordHash,
    });
    return this.usersRepository.save(newUser);
  }

  public async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  public async findById(id: string): Promise<User> {
    const user: User | null = await this.usersRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  public async findByIds(ids: string[]): Promise<User[]> {
    const users: User[] = await this.usersRepository.find({
      where: { id: In(ids) },
    });
    if (users.length !== ids.length) {
      const foundIds: string[] = users.map((user) => user.id);
      const missingIds: string[] = ids.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Users with IDs ${missingIds.join(', ')} not found`,
      );
    }
    return users;
  }

  public async delete(id: string): Promise<boolean> {
    const groupsOwned: Group[] = await this.groupsRepository.find({
      where: { owner: { id } },
      relations: ['owner'],
    });

    if (groupsOwned.length > 0) {
      await this.groupsRepository.remove(groupsOwned);
    }

    const result: DeleteResult = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return true;
  }

  public async exists(userId: string): Promise<boolean> {
    const count: number = await this.usersRepository.count({
      where: { id: userId },
    });
    return count > 0;
  }

  public async findByUsername(username: string): Promise<User | null> {
    username = username.toLowerCase();

    const user = await this.usersRepository.findOne({ where: { username } });

    return user;
  }

  public async createUser(createUserDto: CreateUserInput): Promise<User> {
    if (!createUserDto.password) {
      throw new BadRequestException('Password is required');
    }

    createUserDto.username = createUserDto.username.toLowerCase();

    const existingUser = await this.usersRepository.findOne({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });

    if (existingUser) {
      throw new BadRequestException('Username or email already exists');
    }

    let passwordHash = createUserDto.password;
    if (createUserDto.password.length !== 60) {
      passwordHash = await bcrypt.hash(createUserDto.password, 10);
    }

    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: passwordHash,
    });

    return await this.usersRepository.save(newUser);
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  public async isValidUser(userId: string): Promise<boolean> {
    const count: number = await this.usersRepository.count({
      where: { id: userId },
    });
    return count > 0;
  }
}
