import { createLogger } from '../utils/logger.js';
import { SearchPlanner } from './search-planner.js';
import { QueryExecutor } from './query-executor.js';
import { ResultConsolidator } from './result-consolidator.js';
import type { UniversalBundle } from '../bundles/types.js';
import type { SearchResult, SearchOptions } from './types.js';

const log = createLogger('core:search:engine');

/**
 * Search Engine - Orchestrates LLM-powered search on bundles
 */
export class SearchEngine {
  /**
   * Execute natural language search on bundle
   * @param bundle - Bundle to search
   * @param query - Natural language query
   * @param options - Search options
   */
  static async query(
    bundle: UniversalBundle,
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult> {
    log.info('Starting search: "%s"', query);
    const startTime = Date.now();

    try {
      // Step 1: LLM creates search plan
      log.debug('Step 1: Creating search plan with LLM...');
      const plan = await SearchPlanner.plan(bundle, query, {
        limit: options?.limit,
      });

      // Step 2: Execute search plan (no LLM)
      log.debug('Step 2: Executing search plan...');
      const matchingRecords = QueryExecutor.execute(bundle, plan);

      // Step 3: LLM consolidates results
      log.debug('Step 3: Consolidating results with LLM...');
      const consolidated = await ResultConsolidator.consolidate(
        query,
        matchingRecords,
        {
          temperature: options?.temperature,
          maxTokens: options?.maxTokens,
        }
      );

      const executionTime = Date.now() - startTime;

      const result: SearchResult = {
        query,
        answer: consolidated.answer,
        insights: consolidated.insights,
        stats: consolidated.stats,
        matchingRecords,
        totalMatches: matchingRecords.length,
        executionTime,
      };

      log.info('Search complete: %d matches in %dms', 
        result.totalMatches, 
        result.executionTime
      );

      return result;
    } catch (error: any) {
      log.error('Search failed: %O', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Execute search and return only matching records (no LLM consolidation)
   * @param bundle - Bundle to search
   * @param query - Natural language query
   * @param options - Search options
   */
  static async queryRaw(
    bundle: UniversalBundle,
    query: string,
    options?: SearchOptions
  ): Promise<Record<string, any>[]> {
    log.debug('Executing raw search: "%s"', query);

    const plan = await SearchPlanner.plan(bundle, query, {
      limit: options?.limit,
    });

    const results = QueryExecutor.execute(bundle, plan);

    log.info('Raw search complete: %d matches', results.length);
    return results;
  }
}