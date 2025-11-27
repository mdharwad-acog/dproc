// src/reports/report-engine.ts
import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { createLogger } from '../utils/logger.js';
import { ConfigManager } from '../config/config-manager.js';
import { ReportSpecLoader } from './report-spec-loader.js';
import { VariableResolver } from './variable-resolver.js';
import { TemplateRenderer } from './template-renderer.js';
import { AutoReportGenerator } from './auto-report-generator.js';
import type { UniversalBundle } from '../bundles/types.js';
import type {
  GeneratedReport,
  ReportContext,
  ReportGenerateOptions,
} from './types.js';

const log = createLogger('core:reports:engine');

/**
 * Report Engine - Orchestrates report generation
 */
export class ReportEngine {
  /**
   * NEW: Auto report - no YAML, no template files, no prompt files.
   * Uses built-in prompt and simple Markdown wrapper.
   */
  static async generateAuto(
    bundle: UniversalBundle,
    options?: ReportGenerateOptions
  ): Promise<GeneratedReport> {
    log.debug('Starting auto report generation');

    // If advanced user provided specPath, delegate to YAML-based flow
    if (options?.specPath) {
      log.debug('specPath provided, delegating to generate() with spec');
      return this.generate(bundle, options.specPath);
    }

    const report = await AutoReportGenerator.generate(bundle, options ?? {});
    log.info('Auto report generated: %s (%dms)', report.metadata.title, report.renderTime);
    return report;
  }

  /**
   * Generate report from bundle and spec (YAML + templates + prompts)
   */
  static async generate(
    bundle: UniversalBundle,
    specPath: string
  ): Promise<GeneratedReport> {
    log.debug('Starting report generation');
    const startTime = Date.now();

    try {
      // 1. Load report spec
      log.debug('Loading report spec: %s', specPath);
      const spec = await ReportSpecLoader.load(specPath);

      // 2. Validate spec
      const errors = ReportSpecLoader.validate(spec);
      if (errors.length > 0) {
        throw new Error(`Invalid report spec: ${errors.join(', ')}`);
      }

      // 3. Build context
      const context: ReportContext = {
        bundle,
        spec,
      };

      // 4. Resolve all variables
      log.debug('Resolving variables');
      const variables = await VariableResolver.resolveAll(spec.variables, context);

      // 5. Get template path
      const templatesDir = ConfigManager.getTemplatesDir();
      if (!templatesDir) {
        throw new Error('Templates directory not configured');
      }

      const templatePath = join(templatesDir, spec.templateFile);
      log.debug('Template path: %s', templatePath);

      // 6. Render template
      log.debug('Rendering template');
      const content = await TemplateRenderer.renderFile(templatePath, variables);

      // 7. Build report
      const renderTime = Date.now() - startTime;
      
      const report: GeneratedReport = {
        metadata: {
          specId: spec.id,
          generatedAt: new Date().toISOString(),
          title: spec.name,
          style: 'spec',
          bundleSource: bundle.metadata.source,
          recordCount: bundle.metadata.recordCount,
          llmProvider: ConfigManager.getLlmConfig()?.provider,
          llmModel: ConfigManager.getLlmConfig()?.model,
        },
        content,
        variables,
        renderTime,
      };

      log.info('Report generated: %s (%dms)', spec.id, renderTime);
      return report;
    } catch (error: any) {
      log.error('Report generation failed: %O', error);
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  /**
   * Generate and save report to file (YAML/spec-based path)
   */
  static async generateAndSave(
    bundle: UniversalBundle,
    specPath: string,
    outputPath: string
  ): Promise<GeneratedReport> {
    log.debug('Generating and saving report to: %s', outputPath);

    const report = await this.generate(bundle, specPath);

    await writeFile(outputPath, report.content, 'utf-8');
    log.info('Report saved to: %s', outputPath);

    return report;
  }

  /**
   * Generate report with custom variables (no bundle required, YAML/spec-based)
   */
  static async generateCustom(
    specPath: string,
    variables: Record<string, any>
  ): Promise<GeneratedReport> {
    log.debug('Generating custom report');
    const startTime = Date.now();

    try {
      const spec = await ReportSpecLoader.load(specPath);

      const templatesDir = ConfigManager.getTemplatesDir();
      if (!templatesDir) {
        throw new Error('Templates directory not configured');
      }

      const templatePath = join(templatesDir, spec.templateFile);
      const content = await TemplateRenderer.renderFile(templatePath, variables);

      const renderTime = Date.now() - startTime;

      const report: GeneratedReport = {
        metadata: {
          specId: spec.id,
          generatedAt: new Date().toISOString(),
          title: spec.name,
          style: 'spec',
        },
        content,
        variables,
        renderTime,
      };

      log.info('Custom report generated: %s (%dms)', spec.id, renderTime);
      return report;
    } catch (error: any) {
      log.error('Custom report generation failed: %O', error);
      throw new Error(`Custom report generation failed: ${error.message}`);
    }
  }
}
