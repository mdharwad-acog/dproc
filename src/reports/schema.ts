import { z } from 'zod';

/**
 * Report Style Schema
 */
export const ReportStyleSchema = z.enum([
  'default',
  'executive',
  'technical',
  'sales',
  'audit',
]);

/**
 * Report Depth Schema
 */
export const ReportDepthSchema = z.enum([
  'summary',
  'standard',
  'detailed',
  'comprehensive',
]);

/**
 * Report Section Schema (with recursive type)
 */
export type ReportSection = {
  title: string;
  content: string;
  order: number;
  subsections?: ReportSection[];
};

export const ReportSectionSchema: z.ZodType<ReportSection> = z.object({
  title: z.string().min(1, 'Section title is required'),
  content: z.string(),
  order: z.number().int().nonnegative(),
  subsections: z.lazy(() => z.array(ReportSectionSchema)).optional(),
}).strict();

/**
 * Report Metadata Schema
 */
export const ReportMetadataSchema = z.object({
  title: z.string().min(1, 'Report title is required'),
  author: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  version: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
}).strict();

/**
 * Report Options Schema
 */
export const ReportOptionsSchema = z.object({
  style: ReportStyleSchema.optional().default('default'),
  depth: ReportDepthSchema.optional().default('standard'),
  focus: z.array(z.string()).optional().default([]),
  includeCharts: z.boolean().optional().default(true),
  includeTableOfContents: z.boolean().optional().default(true),
  includeExecutiveSummary: z.boolean().optional().default(false),
  pageNumbers: z.boolean().optional().default(true),
  headerText: z.string().optional(),
  footerText: z.string().optional(),
}).strict();

/**
 * Report Schema
 */
export const ReportSchema = z.object({
  metadata: ReportMetadataSchema,
  sections: z.array(ReportSectionSchema).min(1, 'Report must have at least one section'),
  options: ReportOptionsSchema.optional(),
}).strict();

/**
 * Type inference
 */
export type ReportStyle = z.infer<typeof ReportStyleSchema>;
export type ReportDepth = z.infer<typeof ReportDepthSchema>;
export type ReportMetadata = z.infer<typeof ReportMetadataSchema>;
export type ReportOptions = z.infer<typeof ReportOptionsSchema>;
export type Report = z.infer<typeof ReportSchema>;

/**
 * Validation helpers
 */
export function validateReport(data: unknown): Report {
  return ReportSchema.parse(data);
}

export function validateReportOptions(data: unknown): ReportOptions {
  return ReportOptionsSchema.parse(data);
}

export function validateReportMetadata(data: unknown): ReportMetadata {
  return ReportMetadataSchema.parse(data);
}
