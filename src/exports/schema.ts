import { z } from 'zod';

/**
 * Export Format Schema
 */
export const ExportFormatSchema = z.enum([
  'pdf',
  'html',
  'markdown',
  'json',
  'csv',
  'xml',
]);

/**
 * PDF Export Options Schema
 */
export const PdfExportOptionsSchema = z.object({
  format: z.literal('pdf'),
  pageSize: z.enum(['A4', 'Letter', 'Legal', 'A3']).optional().default('A4'),
  orientation: z.enum(['portrait', 'landscape']).optional().default('portrait'),
  margin: z.object({
    top: z.string().optional().default('1cm'),
    right: z.string().optional().default('1cm'),
    bottom: z.string().optional().default('1cm'),
    left: z.string().optional().default('1cm'),
  }).optional(),
  displayHeaderFooter: z.boolean().optional().default(true),
  printBackground: z.boolean().optional().default(true),
}).strict();

/**
 * HTML Export Options Schema
 */
export const HtmlExportOptionsSchema = z.object({
  format: z.literal('html'),
  standalone: z.boolean().optional().default(true),
  includeCSS: z.boolean().optional().default(true),
  inlineCSS: z.boolean().optional().default(false),
  theme: z.string().optional().default('default'),
}).strict();

/**
 * Markdown Export Options Schema
 */
export const MarkdownExportOptionsSchema = z.object({
  format: z.literal('markdown'),
  flavor: z.enum(['commonmark', 'gfm', 'mdx']).optional().default('gfm'),
  includeMetadata: z.boolean().optional().default(true),
  wrapWidth: z.number().int().positive().optional().default(80),
}).strict();

/**
 * JSON Export Options Schema
 */
export const JsonExportOptionsSchema = z.object({
  format: z.literal('json'),
  pretty: z.boolean().optional().default(true),
  indent: z.number().int().min(0).max(8).optional().default(2),
}).strict();

/**
 * CSV Export Options Schema
 */
export const CsvExportOptionsSchema = z.object({
  format: z.literal('csv'),
  delimiter: z.string().length(1).optional().default(','),
  quote: z.string().length(1).optional().default('"'),
  escape: z.string().length(1).optional().default('"'),
  header: z.boolean().optional().default(true),
  encoding: z.string().optional().default('utf-8'),
}).strict();

/**
 * XML Export Options Schema
 */
export const XmlExportOptionsSchema = z.object({
  format: z.literal('xml'),
  pretty: z.boolean().optional().default(true),
  indent: z.number().int().min(0).max(8).optional().default(2),
  declaration: z.boolean().optional().default(true),
  rootElement: z.string().optional().default('root'),
}).strict();

/**
 * Union Export Options Schema
 */
export const ExportOptionsSchema = z.discriminatedUnion('format', [
  PdfExportOptionsSchema,
  HtmlExportOptionsSchema,
  MarkdownExportOptionsSchema,
  JsonExportOptionsSchema,
  CsvExportOptionsSchema,
  XmlExportOptionsSchema,
]);

/**
 * Export Request Schema
 */
export const ExportRequestSchema = z.object({
  data: z.unknown(),
  outputPath: z.string().min(1, 'Output path is required'),
  options: ExportOptionsSchema,
  overwrite: z.boolean().optional().default(false),
}).strict();

/**
 * Export Result Schema
 */
export const ExportResultSchema = z.object({
  success: z.boolean(),
  outputPath: z.string(),
  format: ExportFormatSchema,
  fileSize: z.number().nonnegative().optional(),
  duration: z.number().nonnegative().optional(),
  error: z.string().optional(),
}).strict();

/**
 * Type inference
 */
export type ExportFormat = z.infer<typeof ExportFormatSchema>;
export type PdfExportOptions = z.infer<typeof PdfExportOptionsSchema>;
export type HtmlExportOptions = z.infer<typeof HtmlExportOptionsSchema>;
export type MarkdownExportOptions = z.infer<typeof MarkdownExportOptionsSchema>;
export type JsonExportOptions = z.infer<typeof JsonExportOptionsSchema>;
export type CsvExportOptions = z.infer<typeof CsvExportOptionsSchema>;
export type XmlExportOptions = z.infer<typeof XmlExportOptionsSchema>;
export type ExportOptions = z.infer<typeof ExportOptionsSchema>;
export type ExportRequest = z.infer<typeof ExportRequestSchema>;
export type ExportResult = z.infer<typeof ExportResultSchema>;

/**
 * Validation helpers
 */
export function validateExportOptions(data: unknown): ExportOptions {
  return ExportOptionsSchema.parse(data);
}

export function validateExportRequest(data: unknown): ExportRequest {
  return ExportRequestSchema.parse(data);
}

export function validateExportResult(data: unknown): ExportResult {
  return ExportResultSchema.parse(data);
}
