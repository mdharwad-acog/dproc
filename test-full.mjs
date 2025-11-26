import { 
  ConfigManager,
  ProviderResolver,
  PromptLoader,
  PromptRenderer 
} from './dist/index.js';

async function testLlm() {
  console.log('\n=== Testing LLM Layer ===\n');

  // 1. Initialize with real API key (you'll need to add yours)
  console.log('1. Initializing config...');
  ConfigManager.init({
    llm: {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY || '',
    },
    promptsDir: './test-prompts',
  });
  console.log('✓ Config initialized\n');

  // 2. Test prompt loading
  console.log('2. Loading prompt template...');
  const template = await PromptLoader.loadTemplate('./test-prompts/summary.prompt.md');
  console.log('Template variables:', template.variables);
  console.log('✓ Prompt loaded\n');

  // 3. Test prompt rendering
  console.log('3. Rendering prompt...');
  const rendered = PromptRenderer.render(template.content, {
    variables: {
      datasetName: 'Customer Data',
      recordCount: 100,
      fields: 'name, age, city',
      sampleData: JSON.stringify([
        { name: 'John', age: 30, city: 'NYC' },
        { name: 'Jane', age: 25, city: 'LA' }
      ], null, 2),
    },
  });
  console.log('Rendered prompt preview:');
  console.log(rendered.substring(0, 200) + '...\n');
  console.log('✓ Prompt rendered\n');

  // 4. Test LLM generation (skip if no API key)
  if (process.env.GEMINI_API_KEY) {
    console.log('4. Testing LLM generation...');
    const client = ProviderResolver.getClient();
    
    const result = await client.generateText(
      'What is 2 + 2? Answer with just the number.',
      { temperature: 0, maxTokens: 10 }
    );
    
    console.log('LLM Response:', result.text);
    console.log('Tokens used:', result.usage?.totalTokens);
    console.log('✓ LLM generation working\n');

    // 5. Test JSON generation
    console.log('5. Testing JSON generation...');
    const jsonResult = await client.generateJson(
      'List 3 colors as a JSON array with key "colors"',
      { colors: ['string'] }
    );
    console.log('JSON Response:', jsonResult);
    console.log('✓ JSON generation working\n');
  } else {
    console.log('4. Skipping LLM test (no API key)');
    console.log('   Set GEMINI_API_KEY environment variable to test\n');
  }

  console.log('=== LLM Layer Tests Complete ===\n');
}

testLlm().catch(console.error);