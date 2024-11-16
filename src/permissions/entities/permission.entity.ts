import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Tweet } from '../../tweets/entities/tweet.entity';
import { PermissionType } from './permission-type.enum';

@ObjectType()
@Entity('permissions')
export class Permission {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Field(() => ID)
  @Column('uuid')
  public tweetId!: string;

  @Field(() => Tweet)
  @ManyToOne(() => Tweet, (tweet) => tweet.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tweetId' })
  public tweet!: Tweet;

  @Field(() => PermissionType)
  @Column({
    type: 'enum',
    enum: PermissionType,
  })
  public type!: PermissionType;

  @Field(() => [String], { nullable: true })
  @Column('text', { array: true, nullable: true })
  public entities?: string[];

  @Field()
  @Column({ default: false })
  public inherit!: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  public createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  public updatedAt!: Date;
}
