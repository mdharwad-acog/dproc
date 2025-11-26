/**
 * Search Layer Types
 */

export interface SearchFilter {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

export interface SearchPlan {
  filters: SearchFilter[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export interface SearchResult {
  query: string;
  answer: string;
  insights?: string[];
  stats?: Record<string, any>;
  matchingRecords: Record<string, any>[];
  totalMatches: number;
  executionTime: number;
}

export interface SearchOptions {
  limit?: number;
  temperature?: number;
  maxTokens?: number;
}