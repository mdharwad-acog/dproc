import { marked } from 'marked';
import { BaseExporter } from './base-exporter.js';
import type { HtmlExportOptions, ExportResult } from './types.js';

/**
 * HTML Exporter - Converts Markdown to HTML
 */
export class HtmlExporter extends BaseExporter {
  constructor() {
    super('html');
  }

  async export(
    inputPath: string,
    outputPath: string,
    options?: HtmlExportOptions
  ): Promise<ExportResult> {
    this.log.info('Exporting %s to HTML: %s', inputPath, outputPath);

    try {
      // Read markdown
      const markdown = await this.readMarkdown(inputPath);

      // Convert to HTML
      const bodyHtml = await marked(markdown);

      // Build full HTML document
      const html = this.buildHtmlDocument(bodyHtml, options);

      // Write output
      await this.writeOutput(outputPath, html);

      return this.createResult(true, outputPath, Buffer.byteLength(html));
    } catch (error: any) {
      this.log.error('Export failed: %O', error);
      return this.createResult(false, outputPath, undefined, error.message);
    }
  }

  private buildHtmlDocument(bodyHtml: string, options?: HtmlExportOptions): string {
    const title = options?.title || 'Document';
    const includeBootstrap = options?.includeBootstrap ?? true;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    ${includeBootstrap ? this.getBootstrapCss() : ''}
    ${options?.css ? `<style>${options.css}</style>` : this.getDefaultCss()}
</head>
<body>
    <div class="container">
        ${options?.title ? `<h1 class="document-title">${this.escapeHtml(options.title)}</h1>` : ''}
        ${options?.author ? `<p class="document-author">By ${this.escapeHtml(options.author)}</p>` : ''}
        ${options?.date ? `<p class="document-date">${this.escapeHtml(options.date)}</p>` : ''}
        ${options?.includeTableOfContents ? this.generateToc(bodyHtml) : ''}
        <div class="document-content">
            ${bodyHtml}
        </div>
        ${options?.watermark ? `<div class="watermark">${this.escapeHtml(options.watermark)}</div>` : ''}
    </div>
    ${options?.javascript ? `<script>${options.javascript}</script>` : ''}
</body>
</html>`;
  }

  private getBootstrapCss(): string {
    return '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">';
  }

  private getDefaultCss(): string {
    return `<style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
        }
        .document-title {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            color: #1a1a1a;
        }
        .document-author, .document-date {
            color: #666;
            margin-bottom: 1rem;
        }
        .document-content {
            margin-top: 2rem;
        }
        code {
            background: #f4f4f4;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background: #f4f4f4;
            padding: 1rem;
            border-radius: 5px;
            overflow-x: auto;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 0.75rem;
            text-align: left;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
        .watermark {
            position: fixed;
            bottom: 20px;
            right: 20px;
            opacity: 0.3;
            font-size: 0.8rem;
            color: #999;
        }
        .toc {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 5px;
            margin: 2rem 0;
        }
        .toc h2 {
            margin-top: 0;
        }
        .toc ul {
            list-style: none;
            padding-left: 0;
        }
        .toc li {
            margin: 0.5rem 0;
        }
    </style>`;
  }

  private generateToc(html: string): string {
    const headingRegex = /<h([2-3])[^>]*>(.*?)<\/h\1>/gi;
    const headings: Array<{ level: number; text: string; id: string }> = [];

    let match;
    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1]);
      const text = match[2].replace(/<[^>]+>/g, '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      headings.push({ level, text, id });
    }

    if (headings.length === 0) {
      return '';
    }

    let toc = '<div class="toc"><h2>Table of Contents</h2><ul>';
    for (const heading of headings) {
      const indent = heading.level === 3 ? 'style="margin-left: 1.5rem"' : '';
      toc += `<li ${indent}><a href="#${heading.id}">${this.escapeHtml(heading.text)}</a></li>`;
    }
    toc += '</ul></div>';

    return toc;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}