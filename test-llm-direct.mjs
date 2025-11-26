import { ConfigManager, ProviderResolver } from './dist/index.js';

console.log('Testing LLM directly...\n');

ConfigManager.init({
  llm: {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
  },
});

const client = ProviderResolver.getClient();

console.log('Calling LLM...');
const result = await client.generateText('Write a 2 sentence summary of: John, age 30, lives in NYC');

console.log('Response:', result.text);
console.log('Tokens:', result.usage?.totalTokens);
