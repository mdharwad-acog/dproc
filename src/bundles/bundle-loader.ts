import { readFile, writeFile } from 'node:fs/promises';
import { createLogger } from '../utils/logger.js';
import type { UniversalBundle } from './types.js';

const log = createLogger('core:bundle:loader');

export class BundleLoader {
  /**
   * Load bundle from JSON file
   */
  static async load(filePath: string): Promise<UniversalBundle> {
    log.debug('Loading bundle from: %s', filePath);

    try {
      const content = await readFile(filePath, 'utf-8');
      const bundle = JSON.parse(content) as UniversalBundle;

      log.info('Loaded bundle: %d records from %s', 
        bundle.metadata.recordCount, 
        bundle.metadata.source
      );

      return bundle;
    } catch (error) {
      log.error('Failed to load bundle: %O', error);
      throw new Error(`Failed to load bundle from ${filePath}`);
    }
  }

  /**
   * Save bundle to JSON file
   */
  static async save(bundle: UniversalBundle, filePath: string): Promise<void> {
    log.debug('Saving bundle to: %s', filePath);

    try {
      const content = JSON.stringify(bundle, null, 2);
      await writeFile(filePath, content, 'utf-8');

      log.info('Saved bundle: %d records to %s', 
        bundle.metadata.recordCount, 
        filePath
      );
    } catch (error) {
      log.error('Failed to save bundle: %O', error);
      throw new Error(`Failed to save bundle to ${filePath}`);
    }
  }
}
