// dproc/src/config/types.ts
export interface DprocConfig {
  llm?: LlmConfig;
  defaultOutputDir?: string;
  
  // Optional: Custom directories for templates/prompts
  templates?: {
    customDir?: string;
  };
  
  prompts?: {
    customDir?: string;
  };
  
  // Optional: Default settings for commands
  reports?: {
    defaultStyle?: 'default' | 'executive' | 'technical' | 'sales' | 'audit';
    defaultDepth?: 'summary' | 'standard' | 'detailed' | 'comprehensive';
    defaultFocus?: string[];
  };
  
  search?: {
    defaultLimit?: number;
    temperature?: number;
  };
  
  export?: {
    defaultFormats?: string[];
    includeTableOfContents?: boolean;
  };
}

export interface LlmConfig {
  provider: 'gemini' | 'openai' | 'deepseek';
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

// Re-export types from schemas for backward compatibility
export type {
  LlmProvider,
  ReportStyle,
  ReportDepth,
} from './schema.js';
