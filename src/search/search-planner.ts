import { createLogger } from '../utils/logger.js';
import { ProviderResolver } from '../llm/provider-resolver.js';
import type { UniversalBundle } from '../bundles/types.js';
import type { SearchPlan } from './types.js';

const log = createLogger('core:search:planner');

export class SearchPlanner {
  static async plan(
    bundle: UniversalBundle,
    query: string,
    options?: { limit?: number }
  ): Promise<SearchPlan> {
    log.debug('Planning search for query: %s', query);

    const schema = bundle.metadata.schema || {};
    const fields = Object.keys(bundle.stats.fieldStats);
    const sampleRecord = bundle.samples.main[0] || {};

    // Build prompt for LLM
    const prompt = `You are a search query analyzer. Convert natural language to structured search filters.

AVAILABLE FIELDS:
${fields.map(f => `- ${f}: ${schema[f] || typeof sampleRecord[f]} (example: ${sampleRecord[f]})`).join('\n')}

USER QUERY: "${query}"

INSTRUCTIONS:
1. Analyze which fields the query is asking about
2. Determine the appropriate operator and value
3. Create filters array with objects: { field, operator, value }

OPERATORS:
- "=" for exact match (e.g., city = "NYC")
- "!=" for not equal
- ">" for greater than (numbers)
- "<" for less than (numbers)
- ">=" for greater or equal
- "<=" for less or equal
- "contains" for partial text match (e.g., name contains "Jo")

IMPORTANT:
- Field names MUST exactly match the available fields
- For age comparisons, use numbers without quotes
- For text searches, use "contains" operator
- For exact matches, use "=" operator

EXAMPLES:
Query: "Find people from NYC"
Response: {"filters":[{"field":"city","operator":"=","value":"NYC"}],"limit":10}

Query: "Who is older than 30?"
Response: {"filters":[{"field":"age","operator":">","value":30}],"limit":10}

Query: "Show active users"
Response: {"filters":[{"field":"active","operator":"=","value":"true"}],"limit":10}

Query: "Find Jane"
Response: {"filters":[{"field":"name","operator":"contains","value":"Jane"}],"limit":10}

NOW CREATE THE SEARCH PLAN:
Respond with ONLY valid JSON in this exact format:
{"filters":[...],"sortBy":"field_name","sortOrder":"asc","limit":10}

If no filters needed, use empty array: {"filters":[],"limit":10}`;

    try {
      const client = ProviderResolver.getClient();
      
      log.debug('Calling LLM to create search plan...');
      const result = await client.generateText(prompt, {
        temperature: 0,
        maxTokens: 300,
      });

      log.debug('LLM response: %s', result.text);

      // Extract JSON from response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        log.warn('No JSON found in LLM response');
        throw new Error('No JSON in response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as SearchPlan;

      // Validate and set defaults
      const plan: SearchPlan = {
        filters: Array.isArray(parsed.filters) ? parsed.filters : [],
        sortBy: parsed.sortBy,
        sortOrder: parsed.sortOrder || 'desc',
        limit: parsed.limit || options?.limit || 10,
      };

      log.info('Search plan created: %d filters, limit=%d', 
        plan.filters.length, 
        plan.limit
      );
      
      if (plan.filters.length > 0) {
        log.debug('Filters: %O', plan.filters);
      }

      return plan;
    } catch (error: any) {
      log.error('Failed to create search plan: %O', error);
      log.warn('Using fallback plan: no filters');
      
      return {
        filters: [],
        limit: options?.limit || 10,
      };
    }
  }
}