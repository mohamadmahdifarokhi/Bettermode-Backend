import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { Group } from '../../groups/entities/group.entity';
import { TweetCategory } from './tweet-category.enum';

@ObjectType()
@Entity('tweets')
export class Tweet {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Field()
  @Column()
  public content!: string;

  @Field(() => Group, { nullable: true })
  @ManyToOne(() => Group, (group) => group.tweets, { nullable: true })
  public group?: Group;

  @Field(() => [String], { nullable: 'itemsAndList' })
  @Column('simple-array', { nullable: true })
  public hashtags!: string[];

  @Field(() => TweetCategory, { nullable: true })
  @Column({
    type: 'enum',
    enum: TweetCategory,
    nullable: true,
  })
  public category?: TweetCategory;

  @Field({ nullable: true })
  @Column({ nullable: true })
  public location?: string;

  @Field(() => Date)
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt!: Date;

  @Field(() => Date)
  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  public updatedAt!: Date;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.tweets, {
    eager: false,
    onDelete: 'CASCADE',
  })
  public author!: User;

  @Field(() => Tweet, { nullable: true })
  @ManyToOne(() => Tweet, (tweet) => tweet.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  public parentTweet?: Tweet;

  @Field(() => [Tweet], { nullable: true })
  @OneToMany(() => Tweet, (tweet) => tweet.parentTweet)
  public replies!: Tweet[];

  @Field(() => [Permission], { nullable: true })
  @OneToMany(() => Permission, (permission) => permission.tweet, {
    cascade: true,
  })
  public permissions!: Permission[];
}
