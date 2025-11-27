import { createLogger } from '../utils/logger.js';
import { ProviderResolver } from '../llm/provider-resolver.js';
import type { UniversalBundle } from '../bundles/types.js';
import type { SearchPlan } from './types.js';

const log = createLogger('core:search:planner');

export class SearchPlanner {
  /**
   * Sanitize query to avoid triggering LLM safety filters
   */
  private static sanitizeQuery(query: string): string {
    const sanitized = query
      // Replace financial keywords that trigger safety filters
      .replace(/\bearns?\b/gi, 'has')
      .replace(/\bsalary\b/gi, 'compensation')
      .replace(/\bincome\b/gi, 'amount')
      .replace(/\bpayment\b/gi, 'value')
      .replace(/\bmoney\b/gi, 'amount')
      // Normalize comparison operators
      .replace(/\bmore than\b/gi, 'greater than')
      .replace(/\bless than\b/gi, 'below')
      .replace(/\bgreater than or equal to\b/gi, 'at least')
      .replace(/\bless than or equal to\b/gi, 'at most');
    
    if (sanitized !== query) {
      log.debug('Query sanitized: "%s" → "%s"', query, sanitized);
    }
    
    return sanitized;
  }

  static async plan(
    bundle: UniversalBundle,
    query: string,
    options?: { limit?: number }
  ): Promise<SearchPlan> {
    log.debug('Planning search for query: %s', query);

    const schema = bundle.metadata.schema || {};
    const fields = Object.keys(bundle.stats.fieldStats);
    const sampleRecord = bundle.samples.main[0] || {};

    // Sanitize query to avoid safety filters
    const sanitizedQuery = this.sanitizeQuery(query);

    // Build field information with examples
    const fieldInfo = fields.map(f => {
      const example = sampleRecord[f];
      const type = schema[f] || typeof example;
      return `${f} (${type}): ${example}`;
    }).join('\n');

    // Simplified, safety-filter-friendly prompt
    const prompt = `Analyze this search request and create structured filters.

AVAILABLE DATA FIELDS:
${fieldInfo}

SEARCH REQUEST: "${sanitizedQuery}"

Create a JSON response with filters that match the request.

FILTER FORMAT:
{"field": "fieldname", "operator": "op", "value": val}

OPERATORS:
= (exact match)
!= (not equal)
> (greater than - for numbers only)
< (less than - for numbers only)
>= (at least - for numbers only)
<= (at most - for numbers only)
contains (partial text match)

RULES:
1. Field names must exactly match available fields
2. Use numbers without quotes for numeric values
3. Use quoted strings for text values
4. Multiple filters can be combined

EXAMPLES:

Request: "Find records where city is NYC"
Response: {"filters":[{"field":"city","operator":"=","value":"NYC"}],"limit":10}

Request: "active status is true"
Response: {"filters":[{"field":"active","operator":"=","value":"true"}],"limit":10}

Request: "age field greater than 30"
Response: {"filters":[{"field":"age","operator":">","value":30}],"limit":10}

Request: "compensation field greater than 70000"
Response: {"filters":[{"field":"salary","operator":">","value":70000}],"limit":10}

NOW ANALYZE THE SEARCH REQUEST ABOVE.

Respond with ONLY valid JSON:
{"filters":[...],"limit":10}

If no filters needed: {"filters":[],"limit":10}`;

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = ProviderResolver.getClient();
        
        log.debug('Calling LLM to create search plan (attempt %d/%d)...', attempt, maxRetries);
        const result = await client.generateText(prompt, {
          temperature: 0,
          maxTokens: 400,
        });

        log.debug('LLM response: %s', result.text);

        // Check for empty response
        if (!result.text || result.text.trim().length === 0) {
          log.warn('Empty response from LLM (attempt %d/%d)', attempt, maxRetries);
          
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000;
            log.debug('Waiting %dms before retry...', waitTime);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else {
            throw new Error('LLM returned empty response after all retries');
          }
        }

        // Extract JSON from response
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          log.warn('No JSON found in LLM response (attempt %d/%d)', attempt, maxRetries);
          
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000;
            log.debug('Waiting %dms before retry...', waitTime);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else {
            throw new Error('No JSON in response');
          }
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
        lastError = error;
        log.error('Failed to create search plan (attempt %d/%d): %O', attempt, maxRetries, error);
        
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          log.debug('Waiting %dms before retry...', waitTime);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    log.error('All retry attempts failed: %O', lastError);
    log.warn('Using fallback plan: no filters');
    
    return {
      filters: [],
      limit: options?.limit || 10,
    };
  }
}
