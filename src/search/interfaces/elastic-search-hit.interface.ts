import { ElasticsearchSource } from './elastic-search-source.interface copy';

export interface ElasticsearchHit {
  _id: string;
  _source: ElasticsearchSource;
}
