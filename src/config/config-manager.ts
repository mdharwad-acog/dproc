import { createLogger } from '../utils/logger.js';
import type { DataProcessorConfig, LlmConfig } from '../types/index.js';

const log = createLogger('core:config');

/**
 * Global configuration manager
 * Must be initialized by consuming application (CLI or Next.js)
 * This class does NOT load config files - that's the consumer's job
 */
export class ConfigManager {
  private static config: DataProcessorConfig = {};
  private static initialized = false;

  /**
   * Initialize with config object provided by consumer
   * @param config - Configuration object (loaded by CLI or Next.js)
   */
  static init(config: DataProcessorConfig): void {
    log.debug('Initializing configuration');
    
    // Validate LLM config if provided
    if (config.llm) {
      if (!config.llm.provider) {
        throw new Error('LLM provider is required');
      }
      if (!config.llm.model) {
        throw new Error('LLM model is required');
      }
      if (!config.llm.apiKey) {
        throw new Error('LLM API key is required');
      }
    }
    
    this.config = config;
    this.initialized = true;
    
    log.info('Config initialized: provider=%s, model=%s', 
      config.llm?.provider, 
      config.llm?.model
    );
  }

  /**
   * Get full configuration
   */
  static get(): DataProcessorConfig {
    if (!this.initialized) {
      log.warn('ConfigManager not initialized, returning empty config');
    }
    return this.config;
  }

  /**
   * Get LLM configuration
   */
  static getLlmConfig(): LlmConfig | undefined {
    return this.config.llm;
  }

  /**
   * Get prompts directory
   */
  static getPromptsDir(): string | undefined {
    return this.config.promptsDir;
  }

  /**
   * Get templates directory
   */
  static getTemplatesDir(): string | undefined {
    return this.config.templatesDir;
  }

  /**
   * Get output directory
   */
  static getOutputDir(): string | undefined {
    return this.config.outputDir;
  }

  /**
   * Check if initialized
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reset configuration (for testing)
   */
  static reset(): void {
    log.debug('Resetting configuration');
    this.config = {};
    this.initialized = false;
  }
}
