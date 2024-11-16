import { TweetCategory } from '../entities/tweet-category.enum';

export class TweetDto {
  id!: string;
  authorId!: string;
  content!: string;
  hashtags?: string[];
  parentTweetId?: string;
  category?: TweetCategory;
  location?: string;
}
