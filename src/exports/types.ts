/**
 * Exports Layer Types
 */

export interface ExportOptions {
  title?: string;
  author?: string;
  date?: string;
  theme?: 'light' | 'dark' | 'auto';
  includeTableOfContents?: boolean;
  watermark?: string;
}

export interface HtmlExportOptions extends ExportOptions {
  css?: string;
  javascript?: string;
  includeBootstrap?: boolean;
}

export interface PdfExportOptions extends ExportOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  headerTemplate?: string;
  footerTemplate?: string;
  displayHeaderFooter?: boolean;
}

export interface MdxExportOptions extends ExportOptions {
  components?: Record<string, string>;
  frontmatter?: Record<string, any>;
}

export interface ExportResult {
  success: boolean;
  outputPath: string;
  format: string;
  size?: number;
  error?: string;
}