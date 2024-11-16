import { ObjectType, Field } from '@nestjs/graphql';
import { Group } from '../entities/group.entity';

@ObjectType()
export class PaginatedGroups {
  @Field(() => [Group])
  public nodes!: Group[];

  @Field()
  public hasNextPage!: boolean;
}
