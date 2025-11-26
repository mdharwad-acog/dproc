import { readFile } from 'node:fs/promises';
import nunjucks from 'nunjucks';
import { createLogger } from '../utils/logger.js';

const log = createLogger('core:reports:template');

/**
 * Template Renderer - Renders Nunjucks templates
 */
export class TemplateRenderer {
  private static env: nunjucks.Environment | null = null;

  /**
   * Initialize Nunjucks environment
   */
  private static getEnv(): nunjucks.Environment {
    if (!this.env) {
      this.env = new nunjucks.Environment(null, {
        autoescape: false,
        trimBlocks: true,
        lstripBlocks: true,
      });

      // Add custom filters
      this.env.addFilter('json', (obj) => JSON.stringify(obj, null, 2));
      this.env.addFilter('uppercase', (str) => String(str).toUpperCase());
      this.env.addFilter('lowercase', (str) => String(str).toLowerCase());

      log.debug('Nunjucks environment initialized');
    }

    return this.env;
  }

  /**
   * Render template from file
   * @param templatePath - Absolute path to template file
   * @param variables - Variables to inject
   */
  static async renderFile(
    templatePath: string,
    variables: Record<string, any>
  ): Promise<string> {
    log.debug('Rendering template: %s', templatePath);
    log.debug('Variables: %O', Object.keys(variables));

    try {
      // Read template
      const templateContent = await readFile(templatePath, 'utf-8');

      // Render
      const rendered = this.render(templateContent, variables);

      log.info('Rendered template: %d characters', rendered.length);
      return rendered;
    } catch (error: any) {
      log.error('Template rendering failed: %O', error);
      throw new Error(`Failed to render template ${templatePath}: ${error.message}`);
    }
  }

  /**
   * Render template from string
   * @param template - Template string
   * @param variables - Variables to inject
   */
  static render(
    template: string,
    variables: Record<string, any>
  ): string {
    log.debug('Rendering template string: %d chars', template.length);

    try {
      const env = this.getEnv();
      const rendered = env.renderString(template, variables);

      log.debug('Rendered: %d characters', rendered.length);
      return rendered;
    } catch (error: any) {
      log.error('Template rendering failed: %O', error);
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  /**
   * Validate template syntax
   */
  static validate(template: string): boolean {
    try {
      const env = this.getEnv();
      env.renderString(template, {});
      return true;
    } catch (error) {
      log.warn('Template validation failed: %O', error);
      return false;
    }
  }
}
