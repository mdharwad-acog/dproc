/**
 * Core type definitions for dproc
 */

export interface ConnectorMetadata {
  name: string;
  version: string;
  extensions: string[];
  supportsStreaming: boolean;
}

export interface ConnectorOptions {
  encoding?: BufferEncoding;
  chunkSize?: number;
  [key: string]: any;
}

export interface LlmConfig {
  provider: 'gemini' | 'openai' | 'deepseek';
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

export interface DataProcessorConfig {
  llm?: LlmConfig;
  promptsDir?: string;
  templatesDir?: string;
  outputDir?: string;
  connectors?: {
    csv?: {
      delimiter?: string;
      encoding?: BufferEncoding;
      chunkSize?: number;
    };
    json?: {
      encoding?: BufferEncoding;
    };
    xml?: {
      ignoreAttributes?: boolean;
      recordPath?: string;
    };
    parquet?: {
      chunkSize?: number;
    };
  };
}