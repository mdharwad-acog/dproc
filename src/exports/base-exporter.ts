import { readFile, writeFile } from 'node:fs/promises';
import { createLogger, Logger } from '../utils/logger.js';
import type { ExportResult } from './types.js';

// const log = createLogger('core:exports:base');

/**
 * Abstract base class for all exporters
 */
export abstract class BaseExporter {
  protected log: Logger;

  constructor(protected format: string) {
    this.log = createLogger(`core:exports:${format}`);
  }

  /**
   * Read markdown content from file
   */
  protected async readMarkdown(inputPath: string): Promise<string> {
    this.log.debug('Reading markdown from: %s', inputPath);
    
    try {
      const content = await readFile(inputPath, 'utf-8');
      this.log.debug('Read %d characters', content.length);
      return content;
    } catch (error: any) {
      this.log.error('Failed to read file: %O', error);
      throw new Error(`Failed to read file: ${inputPath}`);
    }
  }

  /**
   * Write output to file
   */
  protected async writeOutput(outputPath: string, content: string | Buffer): Promise<void> {
    this.log.debug('Writing output to: %s', outputPath);
    
    try {
      await writeFile(outputPath, content);
      const size = Buffer.byteLength(content);
      this.log.info('Wrote %d bytes to %s', size, outputPath);
    } catch (error: any) {
      this.log.error('Failed to write file: %O', error);
      throw new Error(`Failed to write file: ${outputPath}`);
    }
  }

  /**
   * Create export result
   */
  protected createResult(
    success: boolean,
    outputPath: string,
    size?: number,
    error?: string
  ): ExportResult {
    return {
      success,
      outputPath,
      format: this.format,
      size,
      error,
    };
  }

  /**
   * Abstract export method - must be implemented by subclasses
   */
  abstract export(inputPath: string, outputPath: string, options?: any): Promise<ExportResult>;
}