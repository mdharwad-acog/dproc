// src/reports/auto-report-generator.ts
import { createLogger } from '../utils/logger.js';
import { ProviderResolver } from '../llm/provider-resolver.js';
import type { UniversalBundle } from '../bundles/types.js';
import type { GeneratedReport, ReportGenerateOptions, TemplateData } from './types.js';

const log = createLogger('core:reports:auto-generator');

export class AutoReportGenerator {
  static async generate(
    bundle: UniversalBundle,
    options: ReportGenerateOptions = {}
  ): Promise<GeneratedReport> {
    const start = Date.now();

    const recordCount = bundle.metadata.recordCount;
    const fields = Object.keys(bundle.stats.fieldStats);
    const title =
      options.title ||
      `Analysis of ${bundle.metadata.source || 'dataset'} (${recordCount} records)`;

    log.info('Generating auto report: %s', title);
    log.debug('Options: %O', options);

    const client = ProviderResolver.getClient();

    const prompt = this.buildPrompt(bundle, options, { title, recordCount, fields });
    log.debug('Prompt length: %d characters', prompt.length);
    log.debug('Prompt preview: %s', prompt.substring(0, 200) + '...');

    log.info('Calling LLM for report generation...');
    const result = await client.generateText(prompt, {
      temperature: options.temperature ?? 0.4,
      maxTokens: options.maxTokens ?? 800,
    });

    log.info('LLM response received');
    log.debug('Response length: %d characters', result.text.length);
    log.debug('Usage: %O', result.usage);

    if (!result.text || result.text.trim().length === 0) {
      log.error('LLM returned empty response!');
      log.warn('Falling back to basic summary');
      
      // Fallback: generate basic summary without LLM
      const fallbackContent = this.generateFallbackContent(bundle, { title, recordCount, fields });
      const content = fallbackContent;
      const end = Date.now();

      const metadata = {
        specId: undefined,
        title,
        style: options.style || 'default',
        generatedAt: new Date().toISOString(),
        bundleSource: bundle.metadata.source,
        recordCount,
        llmProvider: undefined,
        llmModel: undefined,
      };

      const templateData: TemplateData = {
        title,
        generated_at: metadata.generatedAt,
        record_count: recordCount,
        fields,
        raw_markdown: content,
      };

      const finalMarkdown = this.wrapAsMarkdown(templateData);
      log.info('Fallback report generated: %d characters', finalMarkdown.length);

      return {
        metadata,
        content: finalMarkdown,
        variables: {},
        renderTime: end - start,
      };
    }

    const content = result.text.trim();
    log.info('LLM content: %d characters', content.length);

    const end = Date.now();

    const metadata = {
      specId: undefined,
      title,
      style: options.style || 'default',
      generatedAt: new Date().toISOString(),
      bundleSource: bundle.metadata.source,
      recordCount,
      llmProvider: undefined,
      llmModel: undefined,
    };

    const templateData: TemplateData = {
      title,
      generated_at: metadata.generatedAt,
      record_count: recordCount,
      fields,
      raw_markdown: content,
    };

    const finalMarkdown = this.wrapAsMarkdown(templateData);
    log.info('Final report: %d characters', finalMarkdown.length);

    return {
      metadata,
      content: finalMarkdown,
      variables: {},
      renderTime: end - start,
    };
  }

  private static buildPrompt(
    bundle: UniversalBundle,
    options: ReportGenerateOptions,
    info: { title: string; recordCount: number; fields: string[] }
  ): string {
    const depth = options.depth || 'standard';
    const tone = options.tone || 'professional';
    const focus = options.focus || ['overview', 'trends', 'insights', 'recommendations'];

    const detailMap: Record<string, string> = {
      summary: '2–3 concise sentences',
      standard: '1–2 short paragraphs',
      detailed: '3–5 paragraphs with bullet points where helpful',
      comprehensive: 'a thorough multi-section analysis using headings and bullet points',
    };

    const depthText = detailMap[depth] || detailMap.standard;

    const focusText = focus
      .map((f) => {
        switch (f) {
          case 'overview':
            return '- High-level overview of what this dataset represents';
          case 'trends':
            return '- Any noticeable patterns or trends across records or fields';
          case 'insights':
            return '- 3–5 key insights that a decision-maker would care about';
          case 'anomalies':
            return '- Any anomalies, outliers, or surprising values worth attention';
          case 'recommendations':
            return '- Actionable recommendations based on the data';
          case 'statistics':
            return '- Summary statistics (counts, ranges, averages) where meaningful';
          default:
            return `- ${f}`;
        }
      })
      .join('\n');

    const sample = bundle.samples.main.slice(0, 5);

    // Simplified prompt to avoid safety filters
    return `Analyze this dataset and provide insights.

Dataset: ${info.title}
Records: ${info.recordCount}
Fields: ${info.fields.join(', ')}

Sample data:
${JSON.stringify(sample, null, 2)}

Provide ${depthText} covering:

${focusText}

Write in Markdown format with headings and bullet points. Keep tone ${tone}.`;
  }

  private static generateFallbackContent(
    bundle: UniversalBundle,
    info: { title: string; recordCount: number; fields: string[] }
  ): string {
    const fieldStats = bundle.stats.fieldStats;
    
    let content = `## Overview\n\n`;
    content += `This dataset contains ${info.recordCount} records with ${info.fields.length} fields.\n\n`;
    
    content += `## Fields\n\n`;
    info.fields.forEach(field => {
      const stats = fieldStats[field];
      content += `- **${field}**: ${stats.type || 'unknown'} (${stats.uniqueCount || 0} unique values)\n`;
    });
    
    content += `\n## Sample Data\n\n`;
    content += `The dataset includes records with fields: ${info.fields.join(', ')}.\n`;
    
    return content;
  }

  private static wrapAsMarkdown(data: TemplateData): string {
    return `# ${data.title}

**Generated at:** ${data.generated_at}  
**Total records:** ${data.record_count}  
**Fields:** ${data.fields.join(', ')}

${data.raw_markdown}

---
*Generated automatically by dproc*
`;
  }
}
