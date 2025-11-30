/**
 * Reports Layer Types
 * Re-export from schemas for backward compatibility
 */

export type {
  ReportStyle,
  ReportDepth,
  ReportSection,
  ReportMetadata,
  ReportOptions,
  Report,
} from "./schema.js";

// ========= Simplified API for auto reports =========

export interface ReportGenerateOptions {
  // Just title - keep it simple
  title?: string;

  // Advanced: use existing YAML spec instead of auto report
  specPath?: string;

  // Optional: LLM overrides
  temperature?: number;
  maxTokens?: number;
}

// ========= Existing YAML-based spec types (kept for compatibility) =========

export interface ReportSpec {
  id: string;
  name: string;
  description?: string;
  templateFile: string;
  variables: ReportVariable[];
  options?: ReportSpecOptions;
}

export interface ReportVariable {
  name: string;
  type: "string" | "number" | "markdown" | "json" | "array" | "llm_generated";
  source?: "bundle" | "llm" | "computed";
  promptFile?: string;
  inputs?: string[];
  defaultValue?: any;
  required?: boolean;
}

export interface ReportSpecOptions {
  temperature?: number;
  maxTokens?: number;
  cachePrompts?: boolean;
}

// ========= Shared types =========

export interface GeneratedReport {
  metadata: GeneratedReportMetadata;
  content: string;
  variables?: Record<string, any>;
  renderTime: number;
}

export interface GeneratedReportMetadata {
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
