import { registerEnumType } from '@nestjs/graphql';

export enum TweetCategory {
  GENERAL = 'GENERAL',
  TECH = 'TECH',
  SPORTS = 'SPORTS',
}

registerEnumType(TweetCategory, {
  name: 'TweetCategory',
  description: 'The category of the tweet',
});
