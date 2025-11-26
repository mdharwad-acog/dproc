
import { join } from 'node:path';
import { createLogger } from '../utils/logger.js';
import { ConfigManager } from '../config/config-manager.js';
import { ProviderResolver } from '../llm/provider-resolver.js';
import { PromptLoader } from '../llm/prompt-loader.js';
import { PromptRenderer } from '../llm/prompt-renderer.js';
import type { UniversalBundle } from '../bundles/types.js';
import type { ReportVariable, ReportContext } from './types.js';



const log = createLogger('core:reports:resolver');

export class VariableResolver {
  static async resolveAll(
    variables: ReportVariable[],
    context: ReportContext
  ): Promise<Record<string, any>> {
    log.debug('Resolving %d variables', variables.length);

    const resolved: Record<string, any> = {};

    for (const variable of variables) {
      try {
        resolved[variable.name] = await this.resolveVariable(variable, context, resolved);
        log.debug('Resolved variable: %s = %s', variable.name, 
          typeof resolved[variable.name] === 'string' 
            ? resolved[variable.name].substring(0, 50) + '...'
            : resolved[variable.name]
        );
      } catch (error: any) {
        log.error('Failed to resolve variable %s: %O', variable.name, error);
        
        if (variable.required) {
          throw new Error(`Failed to resolve required variable: ${variable.name}`);
        }
        
        resolved[variable.name] = variable.defaultValue ?? null;
      }
    }

    log.info('Resolved all variables: %O', Object.keys(resolved));
    return resolved;
  }

  private static async resolveVariable(
    variable: ReportVariable,
    context: ReportContext,
    resolvedVars: Record<string, any>
  ): Promise<any> {
    switch (variable.source) {
      case 'bundle':
        return this.resolveFromBundle(variable, context.bundle);
      
      case 'llm':
        return this.resolveFromLlm(variable, context, resolvedVars);
      
      case 'computed':
        return this.resolveComputed(variable, context, resolvedVars);
      
      default:
        if (variable.defaultValue !== undefined) {
          return variable.defaultValue;
        }
        return this.resolveFromBundle(variable, context.bundle);
    }
  }

  private static resolveFromBundle(
    variable: ReportVariable,
    bundle?: UniversalBundle
  ): any {
    if (!bundle) {
      throw new Error('No bundle provided in context');
    }

    log.debug('Resolving from bundle: %s', variable.name);

    switch (variable.name) {
      case 'recordCount':
        return bundle.metadata.recordCount;
      
      case 'source':
        return bundle.metadata.source;
      
      case 'sourceFile':
        return bundle.metadata.sourceFile;
      
      case 'ingestedAt':
        return bundle.metadata.ingestedAt;
      
      case 'samples':
        return bundle.samples.main;
      
      case 'stats':
        return bundle.stats;
      
      case 'fields':
        return Object.keys(bundle.stats.fieldStats);
      
      default:
        return (bundle as any)[variable.name];
    }
  }

  private static async resolveFromLlm(
    variable: ReportVariable,
    context: ReportContext,
    resolvedVars: Record<string, any>
  ): Promise<any> {
    if (!variable.promptFile) {
      throw new Error(`LLM variable ${variable.name} missing promptFile`);
    }

    log.info('Resolving from LLM: %s (this may take a few seconds)', variable.name);

    const promptsDir = ConfigManager.getPromptsDir();
    if (!promptsDir) {
      throw new Error('Prompts directory not configured');
    }

    const promptPath = join(promptsDir, variable.promptFile);
    const promptTemplate = await PromptLoader.load(promptPath);

    const inputVars: Record<string, any> = {};
    Object.assign(inputVars, resolvedVars);

    if (variable.inputs && variable.inputs.length > 0) {
      for (const input of variable.inputs) {
        if (input === 'recordCount' && context.bundle) {
          inputVars.recordCount = context.bundle.metadata.recordCount;
        } else if (input === 'fields' && context.bundle) {
          inputVars.fields = Object.keys(context.bundle.stats.fieldStats).join(', ');
        } else if (input === 'samples' && context.bundle) {
          inputVars.samples = JSON.stringify(context.bundle.samples.main, null, 2);
        } else if (resolvedVars[input] !== undefined) {
          inputVars[input] = resolvedVars[input];
        }
      }
    }

    const renderedPrompt = PromptRenderer.render(promptTemplate, {
      variables: inputVars,
    });

    log.debug('Calling LLM for %s...', variable.name);

    const client = ProviderResolver.getClient();
    
    if (variable.type === 'json') {
      const result = await client.generateJson(renderedPrompt, undefined, {
        temperature: context.spec?.options?.temperature,
        maxTokens: context.spec?.options?.maxTokens,
      });
      return result;
    } else {
      const result = await client.generateText(renderedPrompt, {
        temperature: context.spec?.options?.temperature,
        maxTokens: context.spec?.options?.maxTokens,
      });
      return result.text.trim();
    }
  }

  private static resolveComputed(
    variable: ReportVariable,
    context: ReportContext,
    _resolvedVars: Record<string, any>
  ): any {
    log.debug('Resolving computed: %s', variable.name);

    if (variable.name === 'generatedAt') {
      return new Date().toISOString();
    }

    if (variable.name === 'fieldList') {
      return Object.keys(context.bundle?.stats.fieldStats || {}).join(', ');
    }

    return variable.defaultValue;
  }

//   private static _getNestedValue(obj: any, path: string): any {
//     const parts = path.split('.');
//     let current = obj;

//     for (const part of parts) {
//       if (current === null || current === undefined) {
//         return undefined;
//       }
//       current = current[part];
//     }

//     return current;
//   }
}