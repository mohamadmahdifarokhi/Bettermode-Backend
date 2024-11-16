import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Tweet } from '../../tweets/entities/tweet.entity';
import { Group } from '../../groups/entities/group.entity';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Field()
  @Column({ unique: true })
  public username!: string;

  @Field()
  @Column({ unique: true })
  public email!: string;

  @Column()
  password!: string;

  @Field()
  @Column({ default: false })
  isAdmin!: boolean;

  @Field(() => [Tweet], { nullable: true })
  @OneToMany(() => Tweet, (tweet) => tweet.author, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  public tweets!: Tweet[];

  @Field(() => [Group], { nullable: true })
  @OneToMany(() => Group, (group) => group.owner, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  public ownedGroups!: Group[];

  @Field(() => [Group], { nullable: true })
  @ManyToMany(() => Group, (group) => group.members, { cascade: false })
  public memberGroups!: Group[];

  @DeleteDateColumn()
  private deletedAt?: Date;

  @Field()
  @Column()
  public name!: string;
}
