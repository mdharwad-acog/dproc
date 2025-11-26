// src/llm/llm-client.ts
import { createLogger, Logger } from '../utils/logger.js';
import type { 
  LlmMessage, 
  LlmGenerateOptions, 
  LlmGenerateResult,
  LlmStreamChunk 
} from './types.js';

// const log = createLogger('core:llm:client');

export abstract class LlmClient {
  protected log: Logger;

  constructor() {
    this.log = createLogger(`core:llm:${this.constructor.name.toLowerCase()}`);
  }

  abstract generateText(
    prompt: string | LlmMessage[],
    options?: LlmGenerateOptions
  ): Promise<LlmGenerateResult>;

  abstract streamText(
    prompt: string | LlmMessage[],
    onChunk: (chunk: LlmStreamChunk) => void,
    options?: LlmGenerateOptions
  ): Promise<void>;

  async generateJson<T = any>(
    prompt: string,
    schema?: any,
    options?: LlmGenerateOptions
  ): Promise<T> {
    this.log.debug('Generating JSON response');
    
    // Construct prompt to guide the LLM to output pure JSON
    const fullPrompt = schema 
      ? `${prompt}\n\nRespond with valid JSON only. Expected schema:\n${JSON.stringify(schema, null, 2)}`
      : `${prompt}\n\nRespond with valid JSON only. Do not wrap in markdown code blocks.`;

    const result = await this.generateText(fullPrompt, options);
    
    try {
      let jsonText = result.text.trim();
      
      this.log.debug('Raw LLM response: %s', jsonText.substring(0, 100) + '...');
      
      // Remove markdown code blocks if present
      // FIX 1: The regex literal was unclosed. Closing / is added.
      if (jsonText.startsWith('```')) {
        // Match ```(json) ... content ... ```
        const match = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        
        // FIX 2: Ensure the second condition is valid (it was `match && match`)
        if (match) {
          // FIX 3: Extracted content is in group 1, so use match[1] and trim it
          jsonText = match[1].trim(); 
          this.log.debug('Extracted JSON from markdown code block');
        } else {
          // Fallback: try to find any JSON object
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            // FIX 4: The full match is at index 0 of the result array
            jsonText = jsonMatch[0].trim();
            this.log.debug('Extracted JSON using fallback regex');
          }
        }
      } else {
        // Try to extract JSON object if wrapped in other text
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          // FIX 5: The full match is at index 0 of the result array
          jsonText = jsonMatch[0].trim();
        }
      }
      
      this.log.debug('JSON to parse: %s', jsonText.substring(0, 100) + '...');
      
      // Final JSON parsing attempt
      const parsed = JSON.parse(jsonText);
      this.log.debug('Successfully parsed JSON response');
      return parsed;
    } catch (error) {
      this.log.error('Failed to parse JSON response: %O', error);
      this.log.error('Full response text: %s', result.text);
      throw new Error('LLM response is not valid JSON');
    }
  }
}