/**
 * LLM Layer Types
 */

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface LlmGenerateResult {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface LlmStreamChunk {
  text: string;
  isComplete: boolean;
}

export type LlmProvider = 'gemini' | 'openai' | 'deepseek';

export interface PromptTemplate {
  content: string;
  variables: string[];
}

export interface PromptRenderOptions {
  variables: Record<string, any>;
  escapeHtml?: boolean;
}
