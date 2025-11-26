import { readFile } from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';
import { BaseConnector } from './base-connector.js';
import type { ConnectorMetadata, ConnectorOptions } from '../types/index.js';

export interface XmlOptions extends ConnectorOptions {
  ignoreAttributes?: boolean;
  recordPath?: string;
}

export class XmlConnector extends BaseConnector<Record<string, any>> {
  readonly metadata: ConnectorMetadata = {
    name: 'xml-connector',
    version: '1.0.0',
    extensions: ['.xml'],
    supportsStreaming: false,
  };

  async read(
    filePath: string,
    options?: XmlOptions
  ): Promise<Record<string, any>[]> {
    this.log.debug('Reading XML file: %s', filePath);

    try {
      const content = await readFile(filePath, {
        encoding: options?.encoding || 'utf8',
      });

      const parser = new XMLParser({
        ignoreAttributes: options?.ignoreAttributes ?? false,
        parseAttributeValue: true,
        parseTagValue: true,
      });

      const parsed = parser.parse(content);
      
      let records = parsed;
      if (options?.recordPath) {
        const pathParts = options.recordPath.split('.');
        for (const part of pathParts) {
          if (records && typeof records === 'object' && part in records) {
            records = records[part];
          } else {
            this.log.warn('Record path not found: %s', options.recordPath);
            records = [];
            break;
          }
        }
      }

      const recordsArray = Array.isArray(records) ? records : [records];

      this.log.info('Read %d records from %s', recordsArray.length, filePath);
      return recordsArray;
    } catch (error) {
      this.log.error('Failed to read XML file: %O', error);
      throw new Error(`Failed to read XML file: ${filePath}`);
    }
  }

  async stream(
    filePath: string,
    onChunk: (chunk: Record<string, any>[]) => Promise<void>,
    options?: XmlOptions
  ): Promise<void> {
    this.log.debug('Streaming XML file (loading all): %s', filePath);
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
