/**
 * Reports Layer Types
 */

// ========= New option-based API (for auto reports) =========

export interface ReportGenerateOptions {
  // High-level style of the report
  style?: 'default' | 'executive' | 'technical' | 'sales' | 'audit';

  // How detailed the report should be
  depth?: 'summary' | 'standard' | 'detailed' | 'comprehensive';

  // What to focus on in the analysis
  focus?: ('overview' | 'trends' | 'insights' | 'anomalies' | 'recommendations' | 'statistics')[];

  // Writing tone
  tone?: 'professional' | 'casual' | 'technical' | 'executive';

  // Override title
  title?: string;

  // LLM options
  temperature?: number;
  maxTokens?: number;

  // Advanced: use existing YAML spec instead of auto report
  specPath?: string;
}

// ========= Existing YAML-based spec types (kept for compatibility) =========

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

// ========= Shared types =========

export interface GeneratedReport {
  metadata: ReportMetadata;
  content: string;
  variables?: Record<string, any>;
  renderTime: number;
}

export interface ReportMetadata {
  specId?: string;
  generatedAt: string;
  title: string;
  style: string;
  bundleSource?: string;
  recordCount?: number;
  llmProvider?: string;
  llmModel?: string;
}

export interface ReportContext {
  bundle?: any;
  variables?: Record<string, any>;
  spec?: ReportSpec;
}

export interface TemplateData {
  title: string;
  generated_at: string;
  record_count: number;
  fields: string[];
  raw_markdown: string;
  [key: string]: any;
}
