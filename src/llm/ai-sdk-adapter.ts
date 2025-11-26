import { generateText, streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { LlmClient } from './llm-client.js';
import { ConfigManager } from '../config/config-manager.js';
import type { 
  LlmMessage, 
  LlmGenerateOptions, 
  LlmGenerateResult,
  LlmStreamChunk,
  LlmProvider 
} from './types.js';

/**
 * AI SDK Adapter - Integrates Vercel AI SDK v5 with dproc
 */
export class AiSdkAdapter extends LlmClient {
  private provider: LlmProvider;
  private model: string;
  private apiKey: string;

  constructor() {
    super();
    
    const config = ConfigManager.getLlmConfig();
    if (!config) {
      throw new Error('LLM configuration not initialized. Call ConfigManager.init() first.');
    }

    this.provider = config.provider;
    this.model = config.model;
    this.apiKey = config.apiKey;

    this.log.debug('Initialized with provider=%s, model=%s', this.provider, this.model);
  }

  /**
   * Get AI SDK model instance based on provider
   */
  private getModel() {
    switch (this.provider) {
      case 'gemini': {
        const google = createGoogleGenerativeAI({
          apiKey: this.apiKey,
        });
        return google(this.model);
      }
      
      case 'openai': {
        const openai = createOpenAI({
          apiKey: this.apiKey,
        });
        return openai(this.model);
      }
      
      case 'deepseek': {
        const deepseek = createOpenAI({
          apiKey: this.apiKey,
          baseURL: 'https://api.deepseek.com/v1',
        });
        return deepseek(this.model);
      }
      
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  /**
   * Convert prompt to AI SDK format
   */
  private formatPrompt(prompt: string | LlmMessage[]): string | any[] {
    if (typeof prompt === 'string') {
      return prompt;
    }

    return prompt.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  async generateText(
    prompt: string | LlmMessage[],
    options?: LlmGenerateOptions
  ): Promise<LlmGenerateResult> {
    this.log.debug('Generating text with %s', this.provider);

    try {
      const model = this.getModel();
      const config = ConfigManager.getLlmConfig()!;

      const result = await generateText({
        model,
        prompt: this.formatPrompt(prompt),
        temperature: options?.temperature ?? config.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? config.maxTokens ?? 2000,
      });

      // AI SDK v5 has 'usage' with 'inputTokens' and 'outputTokens'
      let usage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined;
      
      if (result.usage) {
        // Map AI SDK v5 properties to our interface
        const inputTokens = (result.usage as any).inputTokens || (result.usage as any).promptTokens || 0;
        const outputTokens = (result.usage as any).outputTokens || (result.usage as any).completionTokens || 0;
        const totalTokens = (result.usage as any).totalTokens || (inputTokens + outputTokens);
        
        usage = {
          promptTokens: inputTokens,
          completionTokens: outputTokens,
          totalTokens,
        };
        
        this.log.info('Generated %d tokens (input: %d, output: %d)', 
          totalTokens, inputTokens, outputTokens);
      } else {
        this.log.info('Generated text (no usage info available)');
      }

      return {
        text: result.text,
        usage,
        finishReason: result.finishReason,
      };
    } catch (error: any) {
      this.log.error('Text generation failed: %O', error);
      throw new Error(`LLM generation failed: ${error.message}`);
    }
  }

  async streamText(
    prompt: string | LlmMessage[],
    onChunk: (chunk: LlmStreamChunk) => void,
    options?: LlmGenerateOptions
  ): Promise<void> {
    this.log.debug('Streaming text with %s', this.provider);

    try {
      const model = this.getModel();
      const config = ConfigManager.getLlmConfig()!;

      const result = await streamText({
        model,
        prompt: this.formatPrompt(prompt),
        temperature: options?.temperature ?? config.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? config.maxTokens ?? 2000,
      });

      let fullText = '';

      for await (const chunk of result.textStream) {
        fullText += chunk;
        onChunk({
          text: chunk,
          isComplete: false,
        });
      }

      // Send final complete signal
      onChunk({
        text: fullText,
        isComplete: true,
      });

      this.log.info('Streaming complete: %d characters', fullText.length);
    } catch (error: any) {
      this.log.error('Text streaming failed: %O', error);
      throw new Error(`LLM streaming failed: ${error.message}`);
    }
  }
}