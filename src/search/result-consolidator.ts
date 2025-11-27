import { createLogger } from '../utils/logger.js';
import { ProviderResolver } from '../llm/provider-resolver.js';
import type { SearchResult } from './types.js';

const log = createLogger('core:search:consolidator');

export class ResultConsolidator {
  static async consolidate(
    query: string,
    results: Record<string, any>[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<Pick<SearchResult, 'answer' | 'insights' | 'stats'>> {
    log.debug('Consolidating %d results for query: %s', results.length, query);

    if (results.length === 0) {
      log.info('No results to consolidate');
      return {
        answer: 'No matching records found for your query.',
        insights: [],
        stats: {},
      };
    }

    const sampleResults = results.slice(0, 5);

    // IMPROVED PROMPT - Ask for shorter, more focused response
    const prompt = `You are a data analyst. The user searched for: "${query}"

Found ${results.length} matching records.

Sample results (first ${sampleResults.length}):
${JSON.stringify(sampleResults, null, 2)}

Provide a JSON response with:
{
  "answer": "Brief 1-2 sentence answer to the query",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "stats": {"stat_name": value}
}

Rules:
- Keep answer concise (max 2 sentences)
- Provide 2-4 key insights only
- Include 2-4 relevant statistics
- Use proper JSON syntax with NO line breaks in strings
- Respond with ONLY valid JSON, no markdown, no code blocks

Response:`;

    try {
      const client = ProviderResolver.getClient();
      const result = await client.generateJson<{
        answer: string;
        insights: string[];
        stats: Record<string, any>;
      }>(prompt, undefined, {
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 1000,  // Increased from 500 to 1000
      });

      log.info('Results consolidated successfully');
      log.debug('Answer length: %d chars', result.answer?.length || 0);
      log.debug('Insights count: %d', result.insights?.length || 0);

      return {
        answer: result.answer || 'Results found.',
        insights: result.insights || [],
        stats: result.stats || {},
      };
    } catch (error: any) {
      log.error('Failed to consolidate results: %O', error);
      
      // Fallback response
      return {
        answer: `Found ${results.length} matching records.`,
        insights: [],
        stats: { total: results.length },
      };
    }
  }
}