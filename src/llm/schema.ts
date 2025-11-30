import { z } from 'zod';

/**
 * LLM Message Role Schema
 */
export const MessageRoleSchema = z.enum(['system', 'user', 'assistant', 'function']);

/**
 * LLM Message Schema
 */
export const MessageSchema = z.object({
  role: MessageRoleSchema,
  content: z.string().min(1, 'Message content cannot be empty'),
  name: z.string().optional(),
  functionCall: z.object({
    name: z.string(),
    arguments: z.string(),
  }).optional(),
}).strict();

/**
 * LLM Request Schema
 */
export const LlmRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1, 'At least one message is required'),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().int().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  stream: z.boolean().optional().default(false),
}).strict();

/**
 * LLM Response Schema
 */
export const LlmResponseSchema = z.object({
  content: z.string(),
  role: MessageRoleSchema,
  finishReason: z.enum(['stop', 'length', 'function_call', 'content_filter']).optional(),
  usage: z.object({
    promptTokens: z.number().int().nonnegative(),
    completionTokens: z.number().int().nonnegative(),
    totalTokens: z.number().int().nonnegative(),
  }).optional(),
}).strict();

/**
 * Type inference
 */
export type MessageRole = z.infer<typeof MessageRoleSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type LlmRequest = z.infer<typeof LlmRequestSchema>;
export type LlmResponse = z.infer<typeof LlmResponseSchema>;

/**
 * Validation helpers
 */
export function validateMessage(data: unknown): Message {
  return MessageSchema.parse(data);
}

export function validateLlmRequest(data: unknown): LlmRequest {
  return LlmRequestSchema.parse(data);
}

export function validateLlmResponse(data: unknown): LlmResponse {
  return LlmResponseSchema.parse(data);
}
