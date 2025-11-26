import { readFile } from 'node:fs/promises';
import { createLogger } from '../utils/logger.js';
import type { PromptTemplate } from './types.js';

const log = createLogger('core:llm:prompt');

/**
 * Prompt Loader - Loads prompt templates from files
 */
export class PromptLoader {
  /**
   * Load prompt from file
   * @param filePath - Absolute path to prompt file
   */
  static async load(filePath: string): Promise<string> {
    log.debug('Loading prompt from: %s', filePath);

    try {
      const content = await readFile(filePath, 'utf-8');
      log.info('Loaded prompt: %d characters', content.length);
      return content;
    } catch (error) {
      log.error('Failed to load prompt: %O', error);
      throw new Error(`Failed to load prompt from ${filePath}`);
    }
  }

  /**
   * Load prompt and parse template variables
   * @param filePath - Absolute path to prompt file
   */
  static async loadTemplate(filePath: string): Promise<PromptTemplate> {
    log.debug('Loading prompt template from: %s', filePath);

    const content = await this.load(filePath);

    // Extract variables from {{ variable }} syntax
    const variableRegex = /\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g;
    const variables = new Set<string>();
    
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      variables.add(match[1]);
    }

    log.debug('Found %d variables: %O', variables.size, Array.from(variables));

    return {
      content,
      variables: Array.from(variables),
    };
  }

  /**
   * Load multiple prompts
   * @param filePaths - Array of absolute paths
   */
  static async loadMultiple(filePaths: string[]): Promise<Record<string, string>> {
    log.debug('Loading %d prompts', filePaths.length);

    const prompts: Record<string, string> = {};

    for (const filePath of filePaths) {
      const name = filePath.split('/').pop()?.replace('.prompt.md', '') || filePath;
      prompts[name] = await this.load(filePath);
    }

    log.info('Loaded %d prompts', Object.keys(prompts).length);
    return prompts;
  }
}
