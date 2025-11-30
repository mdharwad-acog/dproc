import { z } from 'zod';

/**
 * Search Query Schema
 */
export const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
  limit: z.number().int().positive().optional().default(10),
  offset: z.number().int().nonnegative().optional().default(0),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  filters: z.record(z.string(), z.unknown()).optional(), // Fixed: specify key and value types
}).strict();

/**
 * Search Result Item Schema
 */
export const SearchResultItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  score: z.number().min(0).max(1),
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(), // Fixed
  highlights: z.array(z.string()).optional(),
}).strict();

/**
 * Search Results Schema
 */
export const SearchResultsSchema = z.object({
  query: z.string(),
  results: z.array(SearchResultItemSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  processingTime: z.number().nonnegative().optional(),
}).strict();

/**
 * Search Options Schema
 */
export const SearchOptionsSchema = z.object({
  fuzzy: z.boolean().optional().default(false),
  caseSensitive: z.boolean().optional().default(false),
  includeMetadata: z.boolean().optional().default(true),
  highlightResults: z.boolean().optional().default(true),
  maxDistance: z.number().int().nonnegative().optional(),
}).strict();

/**
 * Type inference
 */
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;
export type SearchResults = z.infer<typeof SearchResultsSchema>;
export type SearchOptions = z.infer<typeof SearchOptionsSchema>;

/**
 * Validation helpers
 */
export function validateSearchQuery(data: unknown): SearchQuery {
  return SearchQuerySchema.parse(data);
}

export function validateSearchResults(data: unknown): SearchResults {
  return SearchResultsSchema.parse(data);
}

export function validateSearchOptions(data: unknown): SearchOptions {
  return SearchOptionsSchema.parse(data);
}
