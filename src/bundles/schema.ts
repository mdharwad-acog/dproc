import { z } from 'zod';

/**
 * Bundle Type Schema
 */
export const BundleTypeSchema = z.enum(['template', 'prompt', 'report', 'custom']);

/**
 * Bundle Metadata Schema
 */
export const BundleMetadataSchema = z.object({
  name: z.string().min(1, 'Bundle name is required'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver format'),
  description: z.string().optional(),
  author: z.string().optional(),
  type: BundleTypeSchema,
  tags: z.array(z.string()).optional().default([]),
  dependencies: z.record(z.string(), z.string()).optional(), // Fixed: key and value types
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
}).strict();

/**
 * Bundle File Schema
 */
export const BundleFileSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  content: z.string(),
  encoding: z.string().optional().default('utf-8'),
}).strict();

/**
 * Bundle Schema
 */
export const BundleSchema = z.object({
  metadata: BundleMetadataSchema,
  files: z.array(BundleFileSchema).min(1, 'Bundle must contain at least one file'),
}).strict();

/**
 * Type inference
 */
export type BundleType = z.infer<typeof BundleTypeSchema>;
export type BundleMetadata = z.infer<typeof BundleMetadataSchema>;
export type BundleFile = z.infer<typeof BundleFileSchema>;
export type Bundle = z.infer<typeof BundleSchema>;

/**
 * Validation helpers
 */
export function validateBundle(data: unknown): Bundle {
  return BundleSchema.parse(data);
}

export function validateBundleMetadata(data: unknown): BundleMetadata {
  return BundleMetadataSchema.parse(data);
}
