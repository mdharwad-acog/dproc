import { z } from "zod";

/**
 * Connector Metadata Schema
 */
export const ConnectorMetadataSchema = z
  .object({
    name: z.string().min(1, "Connector name is required"),
    version: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/, "Version must be semver format (e.g., 1.0.0)"),
    extensions: z
      .array(z.string().min(1))
      .min(1, "At least one extension is required"),
    supportsStreaming: z.boolean(),
  })
  .strict();

/**
 * Connector Options Schema
 */
export const ConnectorOptionsSchema = z
  .object({
    encoding: z
      .enum([
        "utf8",
        "utf-8",
        "ascii",
        "base64",
        "base64url",
        "hex",
        "binary",
        "latin1",
        "ucs2",
        "ucs-2",
        "utf16le",
        "utf-16le",
      ])
      .optional()
      .default("utf-8"),
    chunkSize: z.number().positive().optional().default(1000),
  })
  .passthrough(); // Allow additional properties

/**
 * CSV Connector Options Schema
 */
export const CsvConnectorOptionsSchema = ConnectorOptionsSchema.extend({
  delimiter: z.string().length(1).optional().default(","),
  quote: z.string().length(1).optional().default('"'),
  escape: z.string().length(1).optional().default('"'),
  skipEmptyLines: z.boolean().optional().default(true),
  columns: z.union([z.array(z.string()), z.boolean()]).optional(),
  fromLine: z.number().positive().optional(),
  toLine: z.number().positive().optional(),
}).strict();

/**
 * JSON Connector Options Schema
 */
export const JsonConnectorOptionsSchema = ConnectorOptionsSchema.extend({
  recordPath: z.string().optional(),
  validate: z.boolean().optional().default(true),
}).strict();

/**
 * XML Connector Options Schema
 */
export const XmlConnectorOptionsSchema = ConnectorOptionsSchema.extend({
  ignoreAttributes: z.boolean().optional().default(false),
  attributeNamePrefix: z.string().optional().default("@_"),
  textNodeName: z.string().optional().default("#text"),
  recordPath: z.string().optional(),
  arrayMode: z.boolean().optional().default(false),
}).strict();

/**
 * Parquet Connector Options Schema
 */
export const ParquetConnectorOptionsSchema = ConnectorOptionsSchema.extend({
  compressionCodec: z
    .enum(["UNCOMPRESSED", "GZIP", "SNAPPY", "LZO", "BROTLI", "LZ4", "ZSTD"])
    .optional(),
  rowGroupSize: z.number().positive().optional(),
}).strict();

/**
 * Data Processor Connectors Config Schema
 */
export const DataProcessorConnectorsConfigSchema = z
  .object({
    csv: CsvConnectorOptionsSchema.optional(),
    json: JsonConnectorOptionsSchema.optional(),
    xml: XmlConnectorOptionsSchema.optional(),
    parquet: ParquetConnectorOptionsSchema.optional(),
  })
  .strict()
  .optional();

/**
 * Data Processor Config Schema
 */
export const DataProcessorConfigSchema = z
  .object({
    llm: z
      .object({
        provider: z.enum(["gemini", "openai", "deepseek"]),
        model: z.string().min(1),
        apiKey: z.string().min(1),
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().positive().optional(),
      })
      .optional(),
    promptsDir: z.string().optional(),
    templatesDir: z.string().optional(),
    outputDir: z.string().optional(),
    connectors: DataProcessorConnectorsConfigSchema,
  })
  .strict();

/**
 * Type inference
 */
export type ConnectorMetadata = z.infer<typeof ConnectorMetadataSchema>;
export type ConnectorOptions = z.infer<typeof ConnectorOptionsSchema>;
export type CsvConnectorOptions = z.infer<typeof CsvConnectorOptionsSchema>;
export type JsonConnectorOptions = z.infer<typeof JsonConnectorOptionsSchema>;
export type XmlConnectorOptions = z.infer<typeof XmlConnectorOptionsSchema>;
export type ParquetConnectorOptions = z.infer<
  typeof ParquetConnectorOptionsSchema
>;
export type DataProcessorConfig = z.infer<typeof DataProcessorConfigSchema>;

/**
 * Validation helpers
 */
export function validateConnectorMetadata(data: unknown): ConnectorMetadata {
  return ConnectorMetadataSchema.parse(data);
}

export function validateConnectorOptions(data: unknown): ConnectorOptions {
  return ConnectorOptionsSchema.parse(data);
}

export function validateCsvConnectorOptions(
  data: unknown
): CsvConnectorOptions {
  return CsvConnectorOptionsSchema.parse(data);
}

export function validateJsonConnectorOptions(
  data: unknown
): JsonConnectorOptions {
  return JsonConnectorOptionsSchema.parse(data);
}

export function validateXmlConnectorOptions(
  data: unknown
): XmlConnectorOptions {
  return XmlConnectorOptionsSchema.parse(data);
}

export function validateParquetConnectorOptions(
  data: unknown
): ParquetConnectorOptions {
  return ParquetConnectorOptionsSchema.parse(data);
}

export function validateDataProcessorConfig(
  data: unknown
): DataProcessorConfig {
  return DataProcessorConfigSchema.parse(data);
}
