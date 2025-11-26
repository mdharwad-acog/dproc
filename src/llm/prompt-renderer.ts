import { createLogger } from '../utils/logger.js';
import type { PromptRenderOptions } from './types.js';

const log = createLogger('core:llm:renderer');

/**
 * Prompt Renderer - Renders prompt templates with variables
 */
export class PromptRenderer {
  /**
   * Render prompt template with variables
   * @param template - Prompt template string
   * @param options - Render options with variables
   */
  static render(template: string, options: PromptRenderOptions): string {
    log.debug('Rendering prompt with %d variables', Object.keys(options.variables).length);

    let rendered = template;

    // Replace all {{ variable }} with values
    for (const [key, value] of Object.entries(options.variables)) {
      const placeholder = new RegExp(`\\{\\{\\s*${this.escapeRegex(key)}\\s*\\}\\}`, 'g');
      
      // Convert value to string
      let stringValue: string;
      
      if (value === null || value === undefined) {
        stringValue = '';
      } else if (typeof value === 'object') {
        // Pretty print objects
        stringValue = JSON.stringify(value, null, 2);
      } else {
        stringValue = String(value);
      }

      // Escape HTML if requested
      if (options.escapeHtml) {
        stringValue = this.escapeHtml(stringValue);
      }

      rendered = rendered.replace(placeholder, stringValue);
    }

    // Check for unresolved variables
    const unresolvedMatches = rendered.match(/\{\{\s*[a-zA-Z0-9_\.]+\s*\}\}/g);
    if (unresolvedMatches) {
      log.warn('Unresolved variables found: %O', unresolvedMatches);
    }

    log.debug('Rendered prompt: %d characters', rendered.length);
    return rendered;
  }

  /**
   * Render with nested object access (e.g., {{ user.name }})
   * @param template - Prompt template
   * @param variables - Variables object
   */
  static renderNested(template: string, variables: Record<string, any>): string {
    log.debug('Rendering with nested variables');

    let rendered = template;

    // Find all {{ path.to.value }} patterns
    const nestedRegex = /\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g;
    const matches = template.matchAll(nestedRegex);

    for (const match of matches) {
      const fullPath = match[1];
      const value = this.getNestedValue(variables, fullPath);
      
      const placeholder = new RegExp(`\\{\\{\\s*${this.escapeRegex(fullPath)}\\s*\\}\\}`, 'g');
      
      const stringValue = value === undefined 
        ? '' 
        : typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : String(value);

      rendered = rendered.replace(placeholder, stringValue);
    }

    return rendered;
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Escape special regex characters
   */
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Escape HTML entities
   */
  private static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Validate that all variables are provided
   */
  static validateVariables(template: string, variables: Record<string, any>): string[] {
    const variableRegex = /\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g;
    const required = new Set<string>();
    
    let match;
    while ((match = variableRegex.exec(template)) !== null) {
      required.add(match[1]);
    }

    const provided = new Set(Object.keys(variables));
    const missing: string[] = [];

    for (const variable of required) {
      // Check if base variable exists (for nested paths)
      const baseVar = variable.split('.')[0];
      if (!provided.has(baseVar)) {
        missing.push(variable);
      }
    }

    if (missing.length > 0) {
      log.warn('Missing variables: %O', missing);
    }

    return missing;
  }
}
