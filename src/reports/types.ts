/**
 * Reports Layer Types
 */

export interface ReportSpec {
  id: string;
  name: string;
  description?: string;
  templateFile: string;
  variables: ReportVariable[];
  options?: ReportOptions;
}

export interface ReportVariable {
  name: string;
  type: 'string' | 'number' | 'markdown' | 'json' | 'array' | 'llm_generated';
  source?: 'bundle' | 'llm' | 'computed';
  promptFile?: string;
  inputs?: string[];
  defaultValue?: any;
  required?: boolean;
}

export interface ReportOptions {
  temperature?: number;
  maxTokens?: number;
  cachePrompts?: boolean;
}

export interface GeneratedReport {
  metadata: ReportMetadata;
  content: string;
  variables: Record<string, any>;
  renderTime: number;
}

export interface ReportMetadata {
  specId: string;
  generatedAt: string;
  bundleSource?: string;
  llmProvider?: string;
  llmModel?: string;
}

export interface ReportContext {
  bundle?: any;
  variables?: Record<string, any>;
  spec?: ReportSpec;
}
