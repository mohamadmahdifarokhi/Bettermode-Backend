import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@ObjectType()
@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  @Field()
  id!: string;

  @Column()
  @Field()
  content!: string;

  @Column()
  @Field()
  senderId!: string;

  @Column()
  @Field()
  receiverId!: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'senderId' })
  @Field(() => User)
  sender!: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'receiverId' })
  @Field(() => User)
  receiver!: User;
}
