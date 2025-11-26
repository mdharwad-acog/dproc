import { createLogger } from '../utils/logger.js';
import type { UniversalBundle, BundleMetadata, BundleStats, FieldStats } from './types.js';

const log = createLogger('core:bundle:builder');

export class BundleBuilder {
  /**
   * Create a bundle from records
   */
  static create(
    records: Record<string, any>[],
    metadata: Partial<BundleMetadata>
  ): UniversalBundle {
    log.debug('Creating bundle from %d records', records.length);

    const fullMetadata: BundleMetadata = {
      source: metadata.source || 'unknown',
      sourceFile: metadata.sourceFile || 'unknown',
      format: metadata.format || 'unknown',
      ingestedAt: new Date().toISOString(),
      recordCount: records.length,
      processingSteps: metadata.processingSteps || ['ingestion'],
      schema: metadata.schema,
    };

    const stats = this.computeStats(records);
    const samples = this.createSamples(records);

    const bundle: UniversalBundle = {
      metadata: fullMetadata,
      records,
      stats,
      samples,
    };

    log.info('Bundle created: %d records, %d fields', 
      records.length, 
      Object.keys(stats.fieldStats).length
    );

    return bundle;
  }

  private static computeStats(records: Record<string, any>[]): BundleStats {
    log.debug('Computing statistics');

    if (records.length === 0) {
      return { fieldStats: {} };
    }

    const fieldStats: Record<string, FieldStats> = {};
    const fields = Object.keys(records[0]);

    for (const field of fields) {
      const values = records.map(r => r[field]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      const uniqueValues = new Set(nonNullValues);

      fieldStats[field] = {
        type: typeof records[0][field],
        nullCount: records.length - nonNullValues.length,
        uniqueCount: uniqueValues.size,
      };
    }

    return { fieldStats };
  }

  private static createSamples(records: Record<string, any>[]): any {
    log.debug('Creating samples');

    const sampleSize = Math.min(10, records.length);
    const main = records.slice(0, sampleSize);

    return { main };
  }
}