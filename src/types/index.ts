/**
 * Core type definitions for dproc
 * Re-export types from schemas for backward compatibility
 */

export type {
  ConnectorMetadata,
  ConnectorOptions,
  CsvConnectorOptions,
  JsonConnectorOptions,
  XmlConnectorOptions,
  ParquetConnectorOptions,
  DataProcessorConfig,
} from './schema.js';

export type {
  LlmConfig,
} from '../config/schema.js';

// Re-export all schemas
export * from './schema.js';
