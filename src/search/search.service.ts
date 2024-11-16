import {
  Injectable,
  Logger,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { Tweet } from '../tweets/entities/tweet.entity';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchHit } from './interfaces/elastic-search-hit.interface';
import { SearchTweetDTO } from './dto/search-tweet.dto';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private readonly index: string;
  private readonly client: Client;

  constructor(private readonly configService: ConfigService) {
    this.index =
      this.configService.get<string>('ELASTICSEARCH_INDEX') || 'tweets';
    this.client = new Client({
      node:
        this.configService.get<string>('ELASTICSEARCH_HOST') ||
        'http://localhost:9200',
    });
  }

  async onModuleInit() {
    await this.initializeElasticsearch();
  }

  async initializeElasticsearch() {
    const maxRetries = 5;
    const retryDelay = 3000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.createIndex();
        this.logger.log('Elasticsearch initialized successfully.');
        break;
      } catch (error: unknown) {
        this.logger.error(
          `Elasticsearch initialization failed (Attempt ${attempt}/${maxRetries}): ${(error as Error).message}`,
        );
        if (attempt === maxRetries) {
          this.logger.error(
            'Max retries reached. Unable to initialize Elasticsearch.',
          );
          throw new InternalServerErrorException(
            'Failed to initialize Elasticsearch.',
          );
        }
        await this.delay(retryDelay);
      }
    }
  }

  async createIndex() {
    try {
      const { body: exists } = await this.client.indices.exists({
        index: this.index,
      });
      if (!exists) {
        await this.client.indices.create({
          index: this.index,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                content: { type: 'text' },
                hashtags: { type: 'keyword' },
                category: { type: 'keyword' },
                location: { type: 'keyword' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
              },
            },
          },
        });
        this.logger.log(`Elasticsearch index "${this.index}" created.`);
      } else {
        this.logger.log(`Elasticsearch index "${this.index}" already exists.`);
      }
    } catch (error: unknown) {
      this.logger.error(
        `Error creating Elasticsearch index: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Failed to create Elasticsearch index.',
      );
    }
  }

  async indexTweet(tweet: Tweet): Promise<void> {
    try {
      await this.client.index({
        index: this.index,
        id: tweet.id,
        body: {
          id: tweet.id,
          content: tweet.content,
          hashtags: tweet.hashtags,
          category: tweet.category,
          location: tweet.location,
          createdAt: tweet.createdAt,
          updatedAt: tweet.updatedAt,
        },
      });
      this.logger.log(`Tweet indexed: ${tweet.id}`);
    } catch (error: unknown) {
      this.logger.error(
        `Error indexing tweet ${tweet.id}: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        `Failed to index tweet ${tweet.id}.`,
      );
    }
  }

  async updateTweet(tweet: Tweet): Promise<void> {
    try {
      await this.client.update({
        index: this.index,
        id: tweet.id,
        body: {
          doc: {
            content: tweet.content,
            hashtags: tweet.hashtags,
            category: tweet.category,
            location: tweet.location,
            updatedAt: tweet.updatedAt,
          },
        },
      });
      this.logger.log(`Tweet updated in Elasticsearch: ${tweet.id}`);
    } catch (error: unknown) {
      this.logger.error(
        `Error updating tweet ${tweet.id} in Elasticsearch: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        `Failed to update tweet ${tweet.id}.`,
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async searchTweets(query: string): Promise<SearchTweetDTO[]> {
    try {
      const response = await this.client.search({
        index: this.index,
        body: {
          query: {
            multi_match: {
              query: query,
              fields: ['content', 'hashtags', 'category', 'location'],
            },
          },
        },
      });

      return response.body.hits.hits.map((hit: ElasticsearchHit) => {
        const { content, hashtags, category, location, createdAt, updatedAt } =
          hit._source;
        return {
          id: hit._id,
          content,
          hashtags,
          category,
          location,
          createdAt,
          updatedAt,
        };
      });
    } catch (error: unknown) {
      this.logger.error(
        `Error searching tweets for query "${query}": ${(error as Error).message}`,
      );
      throw new InternalServerErrorException('Failed to search tweets.');
    }
  }
}
