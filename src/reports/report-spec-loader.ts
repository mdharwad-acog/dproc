import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import { createLogger } from '../utils/logger.js';
import type { ReportSpec } from './types.js';

const log = createLogger('core:reports:spec-loader');

/**
 * Report Spec Loader - Loads report specifications from YAML files
 */
export class ReportSpecLoader {
  /**
   * Load report spec from YAML file
   * @param filePath - Absolute path to spec file
   */
  static async load(filePath: string): Promise<ReportSpec> {
    log.debug('Loading report spec from: %s', filePath);

    try {
      const content = await readFile(filePath, 'utf-8');
      const spec = parseYaml(content) as ReportSpec;

      // Validate required fields
      if (!spec.id) {
        throw new Error('Report spec missing required field: id');
      }
      if (!spec.templateFile) {
        throw new Error('Report spec missing required field: templateFile');
      }
      if (!spec.variables || !Array.isArray(spec.variables)) {
        throw new Error('Report spec missing or invalid field: variables');
      }

      log.info('Loaded report spec: %s (%d variables)', spec.id, spec.variables.length);
      return spec;
    } catch (error: any) {
      log.error('Failed to load report spec: %O', error);
      throw new Error(`Failed to load report spec from ${filePath}: ${error.message}`);
    }
  }

  /**
   * Validate report spec
   */
  static validate(spec: ReportSpec): string[] {
    log.debug('Validating report spec: %s', spec.id);

    const errors: string[] = [];

    // Check required fields
    if (!spec.id) errors.push('Missing field: id');
    if (!spec.templateFile) errors.push('Missing field: templateFile');
    
    // Validate variables
    if (!spec.variables || !Array.isArray(spec.variables)) {
      errors.push('Missing or invalid field: variables');
    } else {
      spec.variables.forEach((variable, index) => {
        if (!variable.name) {
          errors.push(`Variable at index ${index} missing field: name`);
        }
        if (!variable.type) {
          errors.push(`Variable ${variable.name} missing field: type`);
        }
        
        // If LLM generated, must have promptFile
        if (variable.source === 'llm' && !variable.promptFile) {
          errors.push(`LLM variable ${variable.name} missing field: promptFile`);
        }
      });
    }

    if (errors.length > 0) {
      log.warn('Validation errors: %O', errors);
    } else {
      log.debug('Validation passed');
    }

    return errors;
  }
}
