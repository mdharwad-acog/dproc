import { BaseConnector } from './base-connector.js';
import { CsvConnector } from './csv-connector.js';
import { JsonConnector } from './json-connector.js';
import { XmlConnector } from './xml-connector.js';
import { ParquetConnector } from './parquet-connector.js';
import { createLogger } from '../utils/logger.js';
import { extname } from 'node:path';

const log = createLogger('core:connector:registry');

/**
 * Registry for managing connectors
 */
export class ConnectorRegistry {
  private static connectors = new Map<string, BaseConnector>();

  static {
    log.debug('Registering built-in connectors');
    this.register(new CsvConnector());
    this.register(new JsonConnector());
    this.register(new XmlConnector());
    this.register(new ParquetConnector());
  }

  /**
   * Register a connector
   */
  static register(connector: BaseConnector): void {
    connector.metadata.extensions.forEach((ext) => {
      this.connectors.set(ext, connector);
      log.debug('Registered %s for extension %s', connector.metadata.name, ext);
    });
  }

  /**
   * Get connector by extension
   */
  static get(extension: string): BaseConnector | undefined {
    return this.connectors.get(extension);
  }

  /**
   * Get connector by file path
   */
  static getByFilePath(filePath: string): BaseConnector | undefined {
    const ext = extname(filePath);
    const connector = this.get(ext);
    
    if (!connector) {
      log.warn('No connector found for extension: %s', ext);
    } else {
      log.debug('Found %s for file %s', connector.metadata.name, filePath);
    }
    
    return connector;
  }

  /**
   * List all registered connectors
   */
  static listConnectors(): BaseConnector[] {
    return Array.from(new Set(this.connectors.values()));
  }

  /**
   * Get supported extensions
   */
  static getSupportedExtensions(): string[] {
    return Array.from(this.connectors.keys());
  }
}