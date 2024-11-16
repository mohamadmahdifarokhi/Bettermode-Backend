import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tweet } from '../../tweets/entities/tweet.entity';

@ObjectType()
@Entity()
export class Group {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Field()
  @Column({ unique: true })
  public name!: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.ownedGroups, { onDelete: 'CASCADE' })
  public owner!: User;

  @Field(() => [User], { nullable: true })
  @ManyToMany(() => User, (user) => user.memberGroups, { cascade: false })
  @JoinTable()
  public members!: User[];

  @Field(() => [Tweet], { nullable: true })
  @OneToMany(() => Tweet, (tweet) => tweet.group)
  public tweets!: Tweet[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field(() => [Group], { nullable: true })
  @ManyToMany(() => Group, (group) => group.parentGroups, {
    cascade: ['insert', 'update'],
  })
  @JoinTable()
  public subgroups!: Group[];

  @Field(() => [Group], { nullable: true })
  @ManyToMany(() => Group, (group) => group.subgroups, {
    cascade: ['insert', 'update'],
  })
  public parentGroups!: Group[];

  @Field(() => Date, { nullable: true })
  @CreateDateColumn()
  public createdAt!: Date;

  @Field(() => Date, { nullable: true })
  @UpdateDateColumn()
  public updatedAt!: Date;

  @Field(() => Date, { nullable: true })
  @DeleteDateColumn()
  public deletedAt?: Date;
}
