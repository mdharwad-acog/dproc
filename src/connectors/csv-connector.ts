import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
import { BaseConnector } from './base-connector.js';
import type { ConnectorMetadata, ConnectorOptions } from '../types/index.js';

export interface CsvOptions extends ConnectorOptions {
  delimiter?: string;
  columns?: boolean | string[];
  skipEmptyLines?: boolean;
  trim?: boolean;
}

export class CsvConnector extends BaseConnector<Record<string, any>> {
  readonly metadata: ConnectorMetadata = {
    name: 'csv-connector',
    version: '1.0.0',
    extensions: ['.csv', '.tsv'],
    supportsStreaming: true,
  };

  async read(
    filePath: string,
    options?: CsvOptions
  ): Promise<Record<string, any>[]> {
    this.log.debug('Reading CSV file: %s', filePath);
    
    const records: Record<string, any>[] = [];
    
    await this.stream(
      filePath,
      async (chunk) => {
        records.push(...chunk);
      },
      options
    );

    this.log.info('Read %d records from %s', records.length, filePath);
    return records;
  }

  async stream(
    filePath: string,
    onChunk: (chunk: Record<string, any>[]) => Promise<void>,
    options?: CsvOptions
  ): Promise<void> {
    this.log.debug('Streaming CSV file: %s', filePath);

    const chunkSize = options?.chunkSize || 10000;
    const delimiter = options?.delimiter || ',';

    return new Promise((resolve, reject) => {
      const parser = createReadStream(filePath, {
        encoding: options?.encoding || 'utf8',
      }).pipe(
        parse({
          columns: options?.columns ?? true,
          delimiter,
          skip_empty_lines: options?.skipEmptyLines ?? true,
          trim: options?.trim ?? true,
        })
      );

      let buffer: Record<string, any>[] = [];
      let totalRecords = 0;

      parser.on('data', (record) => {
        buffer.push(record);

        if (buffer.length >= chunkSize) {
          parser.pause();
          
          const chunk = [...buffer];
          buffer = [];
          
          this.log.debug('Processing chunk of %d records', chunk.length);
          
          onChunk(chunk)
            .then(() => {
              totalRecords += chunk.length;
              parser.resume();
            })
            .catch(reject);
        }
      });

      parser.on('end', async () => {
        if (buffer.length > 0) {
          this.log.debug('Processing final chunk of %d records', buffer.length);
          try {
            await onChunk(buffer);
            totalRecords += buffer.length;
          } catch (error) {
            reject(error);
            return;
          }
        }

        this.log.info('Streamed total of %d records', totalRecords);
        resolve();
      });

      parser.on('error', (error) => {
        this.log.error('CSV parsing error: %O', error);
        reject(error);
      });
    });
  }

  inferSchema(sample: Record<string, any>[]): Record<string, string> {
    this.log.debug('Inferring schema from %d samples', sample.length);

    if (sample.length === 0) {
      this.log.warn('Empty sample provided for schema inference');
      return {};
    }

    const schema: Record<string, string> = {};
    const firstRecord = sample[0];

    for (const key of Object.keys(firstRecord)) {
      const value = firstRecord[key];
      
      if (value === null || value === undefined || value === '') {
        schema[key] = 'unknown';
      } else if (!isNaN(Number(value)) && value !== '') {
        schema[key] = 'number';
      } else if (value === 'true' || value === 'false') {
        schema[key] = 'boolean';
      } else if (this.isISODate(value)) {
        schema[key] = 'date';
      } else {
        schema[key] = 'string';
      }
    }

    this.log.debug('Inferred schema: %O', schema);
    return schema;
  }

  private isISODate(value: string): boolean {
    if (typeof value !== 'string') return false;
    
    const date = new Date(value);
    return !isNaN(date.getTime()) && value.includes('-');
  }
}
