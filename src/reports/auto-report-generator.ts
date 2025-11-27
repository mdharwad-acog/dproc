// src/reports/auto-report-generator.ts
import { ProviderResolver } from '../llm/provider-resolver.js';
import type { UniversalBundle } from '../bundles/types.js';
import type { GeneratedReport, ReportGenerateOptions, TemplateData } from './types.js';

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

    const client = ProviderResolver.getClient();

    const prompt = this.buildPrompt(bundle, options, { title, recordCount, fields });

    const result = await client.generateText(prompt, {
      temperature: options.temperature ?? 0.4,
      maxTokens: options.maxTokens ?? 800,
    });

    const content = result.text.trim();
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
            return '- High-level overview of what this dataset represents.';
          case 'trends':
            return '- Any noticeable patterns or trends across records or fields.';
          case 'insights':
            return '- 3–5 key insights that a decision-maker would care about.';
          case 'anomalies':
            return '- Any anomalies, outliers, or surprising values worth attention.';
          case 'recommendations':
            return '- Actionable recommendations based on the data.';
          case 'statistics':
            return '- Summary statistics (counts, ranges, averages) where meaningful.';
          default:
            return `- ${f}`;
        }
      })
      .join('\n');

    const sample = bundle.samples.main.slice(0, 5);

    return `You are a senior data analyst.

A dataset has been provided with the following metadata:

- Title: ${info.title}
- Record count: ${info.recordCount}
- Fields: ${info.fields.join(', ')}

Here is a small JSON sample of the data (do not repeat it verbatim, just use it to understand structure):

${JSON.stringify(sample, null, 2)}

Write a ${depthText} in Markdown format that:

${focusText}

Guidelines:
- Tone: ${tone}.
- Audience: technically literate but non-expert stakeholders.
- Use Markdown headings (##, ###) and bullet points where appropriate.
- Do NOT include raw JSON in the answer.
- Do NOT mention that you are an AI; just present the analysis.
`;
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
