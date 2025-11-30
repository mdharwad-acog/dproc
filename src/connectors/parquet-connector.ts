import pkg from "parquetjs";
import { BaseConnector } from "./base-connector.js";
import { validateParquetConnectorOptions } from "../types/schema.js";
import type { ConnectorMetadata } from "../types/index.js";
import type { ParquetConnectorOptions } from "../types/schema.js";

const { ParquetReader } = pkg;

export class ParquetConnector extends BaseConnector<Record<string, any>> {
  readonly metadata: ConnectorMetadata = {
    name: "parquet-connector",
    version: "1.0.0",
    extensions: [".parquet"],
    supportsStreaming: true,
  };

  async read(
    filePath: string,
    options?: ParquetConnectorOptions
  ): Promise<Record<string, any>[]> {
    this.log.debug("Reading Parquet file: %s", filePath);

    // Validate options
    const validatedOptions = options
      ? validateParquetConnectorOptions(options)
      : undefined;

    const records: Record<string, any>[] = [];

    await this.stream(
      filePath,
      async (chunk) => {
        records.push(...chunk);
      },
      validatedOptions
    );

    this.log.info("Read %d records from %s", records.length, filePath);
    return records;
  }

  async stream(
    filePath: string,
    onChunk: (chunk: Record<string, any>[]) => Promise<void>,
    options?: ParquetConnectorOptions
  ): Promise<void> {
    this.log.debug("Streaming Parquet file: %s", filePath);

    // Validate options
    const validatedOptions = options
      ? validateParquetConnectorOptions(options)
      : undefined;

    const chunkSize = validatedOptions?.chunkSize || 1000;

    try {
      const reader = await ParquetReader.openFile(filePath);
      const cursor = reader.getCursor();

      let buffer: Record<string, any>[] = [];
      let record = null;
      let totalRecords = 0;

      while ((record = await cursor.next())) {
        buffer.push(record);

        if (buffer.length >= chunkSize) {
          this.log.debug("Processing chunk of %d records", buffer.length);
          await onChunk([...buffer]);
          totalRecords += buffer.length;
          buffer = [];
        }
      }

      // Process remaining records
      if (buffer.length > 0) {
        this.log.debug("Processing final chunk of %d records", buffer.length);
        await onChunk(buffer);
        totalRecords += buffer.length;
      }

      await reader.close();
      this.log.info("Streamed total of %d records", totalRecords);
    } catch (error: any) {
      this.log.error("Parquet reading error: %O", error);
      throw new Error(`Failed to read Parquet file: ${error.message}`);
    }
  }

  inferSchema(sample: Record<string, any>[]): Record<string, string> {
    this.log.debug("Inferring schema from %d samples", sample.length);

    if (sample.length === 0) {
      this.log.warn("Empty sample provided for schema inference");
      return {};
    }

    const schema: Record<string, string> = {};
    const firstRecord = sample[0];

    for (const [key, value] of Object.entries(firstRecord)) {
      schema[key] = typeof value;
    }

    this.log.debug("Inferred schema: %O", schema);
    return schema;
  }
}
