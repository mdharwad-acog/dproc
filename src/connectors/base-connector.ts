import { createLogger, Logger } from '../utils/logger.js';
import type { ConnectorMetadata, ConnectorOptions } from '../types/index.js';

/**
 * Abstract base class for all connectors
 */
export abstract class BaseConnector<T = Record<string, any>> {
  protected log: Logger;
  abstract readonly metadata: ConnectorMetadata;

  constructor() {
    const className = this.constructor.name.toLowerCase();
    this.log = createLogger(`core:connector:${className}`);
  }

  /**
   * Read all records from file
   * @param filePath - Absolute path to file
   * @param options - Connector-specific options
   */
  abstract read(filePath: string, options?: ConnectorOptions): Promise<T[]>;

  /**
   * Stream records from file in chunks
   * @param filePath - Absolute path to file
   * @param onChunk - Callback for each chunk
   * @param options - Connector-specific options
   */
  abstract stream(
    filePath: string,
    onChunk: (chunk: T[]) => Promise<void>,
    options?: ConnectorOptions
  ): Promise<void>;

  /**
   * Infer schema from sample records
   * @param sample - Sample records
   */
  abstract inferSchema(sample: T[]): Record<string, string>;

  /**
   * Validate file before processing (optional override)
   * @param filePath - Absolute path to file
   */
  async validate(filePath: string): Promise<boolean> {
    this.log.debug('Default validation (always passes): %s', filePath);
    return true;
  }
}
