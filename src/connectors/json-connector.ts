import { readFile } from 'node:fs/promises';
import { BaseConnector } from './base-connector.js';
import type { ConnectorMetadata, ConnectorOptions } from '../types/index.js';

export class JsonConnector extends BaseConnector<Record<string, any>> {
  readonly metadata: ConnectorMetadata = {
    name: 'json-connector',
    version: '1.0.0',
    extensions: ['.json'],
    supportsStreaming: false,
  };

  async read(
    filePath: string,
    options?: ConnectorOptions
  ): Promise<Record<string, any>[]> {
    this.log.debug('Reading JSON file: %s', filePath);

    try {
      const content = await readFile(filePath, {
        encoding: options?.encoding || 'utf8',
      });

      const data = JSON.parse(content);
      const records = Array.isArray(data) ? data : [data];

      this.log.info('Read %d records from %s', records.length, filePath);
      return records;
    } catch (error) {
      this.log.error('Failed to read JSON file: %O', error);
      throw new Error(`Failed to read JSON file: ${filePath}`);
    }
  }

  async stream(
    filePath: string,
    onChunk: (chunk: Record<string, any>[]) => Promise<void>,
    options?: ConnectorOptions
  ): Promise<void> {
    this.log.debug('Streaming JSON file (loading all): %s', filePath);
    const records = await this.read(filePath, options);
    await onChunk(records);
  }

  inferSchema(sample: Record<string, any>[]): Record<string, string> {
    this.log.debug('Inferring schema from %d samples', sample.length);

    if (sample.length === 0) {
      return {};
    }

    const schema: Record<string, string> = {};
    const firstRecord = sample[0];

    for (const [key, value] of Object.entries(firstRecord)) {
      if (value === null || value === undefined) {
        schema[key] = 'unknown';
      } else if (Array.isArray(value)) {
        schema[key] = 'array';
      } else {
        schema[key] = typeof value;
      }
    }

    this.log.debug('Inferred schema: %O', schema);
    return schema;
  }
}
