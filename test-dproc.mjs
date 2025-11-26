import { ConnectorRegistry, BundleBuilder, ConfigManager } from './dist/index.js';

// Initialize config
ConfigManager.init({
  llm: {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    apiKey: 'test-key',
  },
});

// Test connector registry
console.log('Supported extensions:', ConnectorRegistry.getSupportedExtensions());

// Test creating bundle
const records = [
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 },
];

const bundle = BundleBuilder.create(records, {
  source: 'test',
  sourceFile: 'test.csv',
  format: 'csv',
});

console.log('Bundle created:', {
  recordCount: bundle.metadata.recordCount,
  fields: Object.keys(bundle.stats.fieldStats),
});
