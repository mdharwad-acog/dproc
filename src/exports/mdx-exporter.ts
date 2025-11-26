import matter from 'gray-matter';
import { BaseExporter } from './base-exporter.js';
import type { MdxExportOptions, ExportResult } from './types.js';

/**
 * MDX Exporter - Converts Markdown to MDX with frontmatter and components
 */
export class MdxExporter extends BaseExporter {
  constructor() {
    super('mdx');
  }

  async export(
    inputPath: string,
    outputPath: string,
    options?: MdxExportOptions
  ): Promise<ExportResult> {
    this.log.info('Exporting %s to MDX: %s', inputPath, outputPath);

    try {
      // Read markdown
      const markdown = await this.readMarkdown(inputPath);

      // Parse existing frontmatter if any
      const parsed = matter(markdown);

      // Merge frontmatter
      const frontmatter = {
        title: options?.title,
        author: options?.author,
        date: options?.date,
        ...parsed.data,
        ...options?.frontmatter,
      };

      // Build MDX content
      const mdx = this.buildMdxContent(parsed.content, frontmatter, options);

      // Write output
      await this.writeOutput(outputPath, mdx);

      return this.createResult(true, outputPath, Buffer.byteLength(mdx));
    } catch (error: any) {
      this.log.error('Export failed: %O', error);
      return this.createResult(false, outputPath, undefined, error.message);
    }
  }

  private buildMdxContent(
    content: string,
    frontmatter: Record<string, any>,
    options?: MdxExportOptions
  ): string {
    // Build frontmatter YAML
    const frontmatterYaml = Object.entries(frontmatter)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}: "${value}"`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      })
      .join('\n');

    // Build component imports
    const imports = options?.components
      ? Object.entries(options.components)
          .map(([name, path]) => `import ${name} from '${path}';`)
          .join('\n')
      : '';

    // Combine everything
    return `---
${frontmatterYaml}
---

${imports ? imports + '\n\n' : ''}${content}`;
  }
}