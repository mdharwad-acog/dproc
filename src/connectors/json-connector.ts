import { readFile } from 'node:fs/promises';
import { BaseConnector } from './base-connector.js';
import { validateJsonConnectorOptions } from '../types/schema.js';
import type { ConnectorMetadata } from '../types/index.js';
import type { JsonConnectorOptions } from '../types/schema.js';

export class JsonConnector extends BaseConnector<any> {
  readonly metadata: ConnectorMetadata = {
    name: 'json-connector',
    version: '1.0.0',
    extensions: ['.json'],
    supportsStreaming: false,
  };

  async read(filePath: string, options?: JsonConnectorOptions): Promise<any> {
    this.log.debug('Reading JSON file: %s', filePath);
    
    // Validate options
    const validatedOptions = options ? validateJsonConnectorOptions(options) : undefined;

    try {
      const content = await readFile(filePath, {
        encoding: validatedOptions?.encoding || 'utf-8',
      });

      const data = JSON.parse(content);

      // Navigate to specific path if provided
      if (validatedOptions?.recordPath) {
        const result = this.getNestedValue(data, validatedOptions.recordPath);
        this.log.info('Extracted data from path: %s', validatedOptions.recordPath);
        return result;
      }

      this.log.info('Read JSON file: %s', filePath);
      return data;
    } catch (error: any) {
      this.log.error('Failed to read JSON file: %O', error);
      throw new Error(`Failed to read JSON file: ${error.message}`);
    }
  }

  async stream(
    filePath: string,
    onChunk: (chunk: any[]) => Promise<void>,
    options?: JsonConnectorOptions
  ): Promise<void> {
    // For JSON, we load all data and send as single chunk
    const data = await this.read(filePath, options);
    const array = Array.isArray(data) ? data : [data];
    await onChunk(array);
  }

  inferSchema(sample: any[]): Record<string, string> {
    this.log.debug('Inferring schema from %d samples', sample.length);

    if (sample.length === 0) {
      this.log.warn('Empty sample provided for schema inference');
      return {};
    }

    const schema: Record<string, string> = {};
    const firstRecord = sample[0];

    for (const [key, value] of Object.entries(firstRecord)) {
      schema[key] = typeof value;
    }

    this.log.debug('Inferred schema: %O', schema);
    return schema;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
