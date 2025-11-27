// Configuration
export { ConfigManager } from './config/index.js';
export type { DataProcessorConfig, LlmConfig } from './config/index.js';

// Connectors
export {
  BaseConnector,
  CsvConnector,
  JsonConnector,
  XmlConnector,
  ParquetConnector,
  ConnectorRegistry,
} from './connectors/index.js';

export type { CsvOptions, XmlOptions } from './connectors/index.js';

// Bundles
export { BundleBuilder, BundleLoader } from './bundles/index.js';
export type {
  UniversalBundle,
  BundleMetadata,
  BundleStats,
  BundleSamples,
  FieldStats,
} from './bundles/index.js';

// LLM
export {
  LlmClient,
  AiSdkAdapter,
  ProviderResolver,
  PromptLoader,
  PromptRenderer,
} from './llm/index.js';

export type {
  LlmMessage,
  LlmGenerateOptions,
  LlmGenerateResult,
  LlmStreamChunk,
  LlmProvider,
  PromptTemplate,
  PromptRenderOptions,
} from './llm/index.js';

// Reports
export { ReportEngine } from './reports/report-engine.js';
export { AutoReportGenerator } from './reports/auto-report-generator.js';
export type {
  ReportSpec,
  ReportVariable,
  ReportOptions,
  GeneratedReport,
  ReportMetadata,
  ReportContext,
  ReportGenerateOptions,
} from './reports/types.js';
// src/index.ts (snippet)
export * from './reports/index.js';



// Search
export {
  SearchEngine,
  SearchPlanner,
  QueryExecutor,
  ResultConsolidator,
} from './search/index.js';

export type {
  SearchFilter,
  SearchPlan,
  SearchResult,
  SearchOptions,
} from './search/index.js';

// Exports
export {
  BaseExporter,
  HtmlExporter,
  PdfExporter,
  MdxExporter,
} from './exports/index.js';

export type {
  ExportOptions,
  HtmlExportOptions,
  PdfExportOptions,
  MdxExportOptions,
  ExportResult,
} from './exports/index.js';

// Utils
export { createLogger } from './utils/index.js';
export type { Logger } from './utils/index.js';

// Types
export type { ConnectorMetadata, ConnectorOptions } from './types/index.js';
