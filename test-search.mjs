import { 
  ConfigManager,
  ConnectorRegistry,
  BundleBuilder,
  SearchEngine,
  createLogger 
} from './dist/index.js';

const log = createLogger('test:search');

async function testSearch() {
  console.log('\n=== Testing Search Layer ===\n');

  // 1. Initialize config
  console.log('1. Initializing config...');
  ConfigManager.init({
    llm: {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY || 'test-key',
    },
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

  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️  Skipping search tests (no API key)');
    console.log('   Set GEMINI_API_KEY to test search\n');
    return;
  }

  // 3. Test search queries
  const queries = [
    'Find all people from NYC',
    'Who is older than 28?',
    'Show me active users',
    'Find Jane',
  ];

  for (const query of queries) {
    console.log(`\n🔍 Query: "${query}"`);
    console.log('   Searching... (this may take a few seconds)');

    const result = await SearchEngine.query(bundle, query, {
      limit: 10,
    });

    console.log('\n   Answer:', result.answer);
    console.log('   Matches:', result.totalMatches);
    
    if (result.insights && result.insights.length > 0) {
      console.log('   Insights:');
      result.insights.forEach(insight => {
        console.log('     -', insight);
      });
    }

    if (result.stats && Object.keys(result.stats).length > 0) {
      console.log('   Stats:', JSON.stringify(result.stats, null, 2));
    }

    console.log('   Matching records:');
    result.matchingRecords.forEach((record, i) => {
      console.log(`     ${i + 1}.`, record.name, '-', record.city, '(age:', record.age + ')');
    });

    console.log('   Execution time:', result.executionTime, 'ms');
  }

  console.log('\n=== Search Layer Tests Complete ===\n');
}

testSearch().catch(console.error);
