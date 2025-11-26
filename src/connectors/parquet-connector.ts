import parquetjs from 'parquetjs';
import { BaseConnector } from './base-connector.js';
import type { ConnectorMetadata, ConnectorOptions } from '../types/index.js';

// Extract ParquetReader from default export
const { ParquetReader } = parquetjs;

export class ParquetConnector extends BaseConnector<Record<string, any>> {
  readonly metadata: ConnectorMetadata = {
    name: 'parquet-connector',
    version: '1.0.0',
    extensions: ['.parquet'],
    supportsStreaming: true,
  };

  async read(
    filePath: string,
    options?: ConnectorOptions
  ): Promise<Record<string, any>[]> {
    this.log.debug('Reading Parquet file: %s', filePath);

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
    options?: ConnectorOptions
  ): Promise<void> {
    this.log.debug('Streaming Parquet file: %s', filePath);

    const chunkSize = options?.chunkSize || 10000;
    let buffer: Record<string, any>[] = [];
    let totalRecords = 0;

    try {
      const reader = await ParquetReader.openFile(filePath);
      const cursor = reader.getCursor();

      let record = null;
      while ((record = await cursor.next())) {
        buffer.push(record);

        if (buffer.length >= chunkSize) {
          this.log.debug('Processing chunk of %d records', buffer.length);
          await onChunk([...buffer]);
          totalRecords += buffer.length;
          buffer = [];
        }
      }

      if (buffer.length > 0) {
        this.log.debug('Processing final chunk of %d records', buffer.length);
        await onChunk(buffer);
        totalRecords += buffer.length;
      }

      await reader.close();
      this.log.info('Streamed total of %d records', totalRecords);
    } catch (error) {
      this.log.error('Failed to stream Parquet file: %O', error);
      throw new Error(`Failed to stream Parquet file: ${filePath}`);
    }
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
