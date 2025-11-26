import { LlmClient } from './llm-client.js';
import { AiSdkAdapter } from './ai-sdk-adapter.js';
import { ConfigManager } from '../config/config-manager.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('core:llm:provider');

/**
 * Provider Resolver - Creates appropriate LLM client based on config
 */
export class ProviderResolver {
  private static cachedClient: LlmClient | null = null;

  /**
   * Get LLM client instance (singleton)
   */
  static getClient(): LlmClient {
    if (this.cachedClient) {
      return this.cachedClient;
    }

    const config = ConfigManager.getLlmConfig();
    if (!config) {
      throw new Error('LLM configuration not initialized');
    }

    log.debug('Creating LLM client for provider: %s', config.provider);

    // For now, we only have AI SDK adapter
    // In future, you can add custom adapters here
    this.cachedClient = new AiSdkAdapter();

    log.info('LLM client created: %s', config.provider);
    return this.cachedClient;
  }

  /**
   * Reset cached client (useful for testing)
   */
  static reset(): void {
    log.debug('Resetting cached client');
    this.cachedClient = null;
  }
}
