import { 
  ConfigManager,
  ConnectorRegistry,
  BundleBuilder,
  ReportEngine,
  createLogger 
} from './dist/index.js';

const log = createLogger('test:reports');

async function testReports() {
  console.log('\n=== Testing Reports Layer ===\n');

  // 1. Initialize config
  console.log('1. Initializing config...');
  ConfigManager.init({
    llm: {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY || 'test-key',
    },
    promptsDir: './test-prompts',
    templatesDir: './test-templates',
  });
  console.log('✓ Config initialized\n');

  // 2. Create test bundle
  console.log('2. Creating test bundle...');
  const connector = ConnectorRegistry.getByFilePath('test-data.csv');
  const records = await connector.read('test-data.csv');
  const bundle = BundleBuilder.create(records, {
    source: 'test-data',
    sourceFile: 'test-data.csv',
    format: 'csv',
  });
  console.log('✓ Bundle created: %d records\n', bundle.metadata.recordCount);

  // 3. Generate report (if API key available)
  if (process.env.GEMINI_API_KEY) {
    console.log('3. Generating report with LLM...');
    console.log('   This will take 10-15 seconds...\n');
    
    const report = await ReportEngine.generateAndSave(
      bundle,
      './test-specs/summary-report.yaml',
      './test-report-output.md'
    );

    console.log('✓ Report generated!\n');
    console.log('Report metadata:');
    console.log('  - Spec ID:', report.metadata.specId);
    console.log('  - Generated at:', report.metadata.generatedAt);
    console.log('  - Render time:', report.renderTime, 'ms');
    console.log('  - Content length:', report.content.length, 'characters');
    console.log('  - Variables resolved:', Object.keys(report.variables).length);
    console.log('\n✓ Report saved to: test-report-output.md\n');

    // Show preview
    console.log('Report preview:');
    console.log('---');
    console.log(report.content.substring(0, 500));
    console.log('...\n---\n');
  } else {
    console.log('3. Skipping report generation (no API key)');
    console.log('   Set GEMINI_API_KEY to test full report generation\n');
  }

  console.log('=== Reports Layer Tests Complete ===\n');
}

testReports().catch(console.error);