import { z } from "zod";

/**
 * LLM Provider Schema
 */
export const LlmProviderSchema = z.enum(["gemini", "openai", "deepseek"]);

/**
 * Report Style Schema
 */
export const ReportStyleSchema = z.enum([
  "default",
  "executive",
  "technical",
  "sales",
  "audit",
]);

/**
 * Report Depth Schema
 */
export const ReportDepthSchema = z.enum([
  "summary",
  "standard",
  "detailed",
  "comprehensive",
]);

/**
 * LLM Configuration Schema
 */
export const LlmConfigSchema = z
  .object({
    provider: LlmProviderSchema,
    model: z.string().min(1, "Model name is required"),
    apiKey: z.string().optional(), // ✅ Make optional - will be loaded from keytar
    temperature: z.number().min(0).max(2).optional().default(0.7),
    maxTokens: z.number().positive().optional(),
  })
  .strict();

/**
 * Templates Configuration Schema
 */
export const TemplatesConfigSchema = z
  .object({
    customDir: z.string().optional(),
  })
  .strict()
  .optional();

/**
 * Prompts Configuration Schema
 */
export const PromptsConfigSchema = z
  .object({
    customDir: z.string().optional(),
  })
  .strict()
  .optional();

/**
 * Reports Configuration Schema
 */
export const ReportsConfigSchema = z
  .object({
    // Remove style, depth, focus - keep config minimal
    defaultOutputDir: z.string().optional(),
  })
  .strict()
  .optional();

/**
 * Search Configuration Schema
 */
export const SearchConfigSchema = z
  .object({
    defaultLimit: z.number().positive().optional().default(10),
    temperature: z.number().min(0).max(2).optional().default(0.7),
  })
  .strict()
  .optional();

/**
 * Export Configuration Schema
 */
export const ExportConfigSchema = z
  .object({
    defaultFormats: z.array(z.string()).optional().default(["pdf", "html"]),
    includeTableOfContents: z.boolean().optional().default(true),
  })
  .strict()
  .optional();

/**
 * Main Dproc Configuration Schema
 */
export const DprocConfigSchema = z
  .object({
    llm: LlmConfigSchema.optional(),
    defaultOutputDir: z.string().optional(),
    templates: TemplatesConfigSchema,
    prompts: PromptsConfigSchema,
    reports: ReportsConfigSchema,
    search: SearchConfigSchema,
    export: ExportConfigSchema,
  })
  .strict();

/**
 * Type inference from schemas
 */
export type LlmProvider = z.infer<typeof LlmProviderSchema>;
export type ReportStyle = z.infer<typeof ReportStyleSchema>;
export type ReportDepth = z.infer<typeof ReportDepthSchema>;
export type LlmConfig = z.infer<typeof LlmConfigSchema>;
export type DprocConfig = z.infer<typeof DprocConfigSchema>;

/**
 * Validation helper functions
 */
export function validateDprocConfig(config: unknown): DprocConfig {
  return DprocConfigSchema.parse(config);
}

export function validateLlmConfig(config: unknown): LlmConfig {
  return LlmConfigSchema.parse(config);
}

/**
 * Safe validation that returns errors instead of throwing
 */
export function safeParseDprocConfig(config: unknown) {
  return DprocConfigSchema.safeParse(config);
}

export function safeParseLlmConfig(config: unknown) {
  return LlmConfigSchema.safeParse(config);
}
