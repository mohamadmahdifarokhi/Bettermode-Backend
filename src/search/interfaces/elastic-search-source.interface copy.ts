export interface ElasticsearchSource {
  id: string;
  content: string;
  hashtags: string[];
  category?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}
