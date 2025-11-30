/**
 * Universal bundle format
 */
export interface UniversalBundle {
  metadata: BundleMetadata;
  records: Record<string, any>[];
  stats: BundleStats;
  samples: BundleSamples;
  extensions?: Record<string, any>;
}

export interface BundleMetadata {
  source: string;
  sourceFile: string;
  format: "csv" | "json" | "xml" | "parquet" | "unknown";
  ingestedAt: string;
  recordCount: number;
  processingSteps: string[];
  schema?: Record<string, string>;
}

export interface BundleStats {
  fieldStats: Record<string, FieldStats>;
  customStats?: Record<string, any>;
}

export interface FieldStats {
  type: string;
  nullCount: number;
  uniqueCount: number;
  distribution?: any;
}

export interface BundleSamples {
  main: Record<string, any>[];
  [key: string]: Record<string, any>[];
}
