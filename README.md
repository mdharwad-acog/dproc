# @aganitha/dproc

> 🎓 **Training Project** - AI-powered data processing engine built as a learning exercise

[![Version](https://img.shields.io/badge/version-1.0.1-blue.svg)](https://npm.aganitha.ai/@aganitha/dproc)
[![Status](https://img.shields.io/badge/status-training-orange.svg)](https://npm.aganitha.ai/@aganitha/dproc)

## ⚠️ Important Disclaimer

**This is a training/learning project** developed to explore AI-powered data processing concepts. It is **NOT production-ready** and should be used for:

- ✅ Learning TypeScript architecture
- ✅ Experimenting with LLM integrations
- ✅ Prototyping data processing workflows
- ✅ Educational purposes and demos

**DO NOT use in production environments** without thorough testing, security audits, and additional development.

---

## What is dproc?

dproc is an educational data processing engine that demonstrates:

- Multi-format data ingestion (CSV, JSON, XML, Parquet)
- LLM integration for AI-powered reports
- Natural language search over structured data
- Multi-format export (HTML, PDF, MDX)

**Built to learn:** Modern TypeScript patterns, AI SDK integration, and data pipeline architecture.

---

## Installation

```
# Install from Aganitha registry
npm install @aganitha/dproc
```

**Prerequisites:**
- Node.js >= 18.0.0
- npm registry configured for @aganitha scope
- Gemini/OpenAI/DeepSeek API key (for LLM features)

---

## Quick Start

```
import { 
  ConfigManager,
  ConnectorRegistry,
  BundleBuilder,
  SearchEngine
} from '@aganitha/dproc';

// 1. Initialize (required)
ConfigManager.init({
  llm: {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
  },
});

// 2. Load data
const connector = ConnectorRegistry.getByFilePath('data.csv');
const records = await connector.read('data.csv');

// 3. Create bundle
const bundle = BundleBuilder.create(records, {
  source: 'my-data',
  format: 'csv',
});

// 4. Search with natural language
const results = await SearchEngine.query(bundle, "Find all active users");
console.log(results.answer); // AI-generated answer
console.log(results.matchingRecords); // Filtered data
```

---

## Architecture

dproc is organized into 7 layers:

```
@aganitha/dproc
├── 1. Configuration Layer - LLM config, directories
├── 2. Connectors Layer - CSV, JSON, XML, Parquet readers
├── 3. Bundles Layer - Normalized data with stats
├── 4. LLM Layer - AI SDK integration
├── 5. Reports Layer - Template-driven report generation
├── 6. Search Layer - NL search with AI query planning
└── 7. Exports Layer - HTML, PDF, MDX output
```

Each layer is independent and can be used separately.

---

## Core Features

### 1. Data Connectors

Read multiple formats with automatic detection:

```
import { ConnectorRegistry } from '@aganitha/dproc';

// Auto-detect format by extension
const connector = ConnectorRegistry.getByFilePath('data.csv');
const records = await connector.read('data.csv');

// Or use specific connector
import { CsvConnector, JsonConnector } from '@aganitha/dproc';
const csvData = await new CsvConnector().read('file.csv');
const jsonData = await new JsonConnector().read('file.json');
```

**Supported formats:**
- CSV/TSV (with streaming for large files)
- JSON (with streaming)
- XML
- Parquet (with streaming)

---

### 2. Bundles (Normalized Data)

Create universal data bundles with automatic statistics:

```
import { BundleBuilder, BundleLoader } from '@aganitha/dproc';

// Create bundle
const bundle = BundleBuilder.create(records, {
  source: 'customer-data',
  format: 'csv',
  sourceFile: 'customers.csv',
});

// Bundle includes:
console.log(bundle.metadata); // Source, format, record count
console.log(bundle.stats); // Field-level statistics
console.log(bundle.samples); // Sample records

// Save and load
await BundleLoader.save(bundle, 'bundle.json');
const loaded = await BundleLoader.load('bundle.json');
```

---

### 3. Natural Language Search

Search data using plain English:

```
import { SearchEngine } from '@aganitha/dproc';

const results = await SearchEngine.query(bundle, "Who is older than 30?");

console.log(results.answer); // AI-generated natural language answer
console.log(results.insights); // ["50% of users are over 30", ...]
console.log(results.stats); // { average_age: 32, count: 42 }
console.log(results.matchingRecords); // Filtered data
console.log(results.totalMatches); // 42
```

**How it works:**
1. LLM converts natural language → structured query
2. Query executor filters data (pure JavaScript)
3. LLM generates insights from results

---

### 4. AI-Powered Reports

Generate reports using YAML specs and templates:

```
import { ReportEngine } from '@aganitha/dproc';

// Generate report
const report = await ReportEngine.generate(bundle, 'report-spec.yaml');

console.log(report.content); // Markdown report
console.log(report.variables); // All resolved variables
console.log(report.metadata); // Generation metadata

// Save to file
await ReportEngine.generateAndSave(
  bundle, 
  'report-spec.yaml', 
  'output.md'
);
```

**Report spec example** (report-spec.yaml):

```
id: summary-report
name: Data Summary Report
templateFile: summary.njk

variables:
  - name: recordCount
    type: number
    source: bundle
    
  - name: summary
    type: markdown
    source: llm
    promptFile: generate-summary.prompt.md
    
options:
  temperature: 0.7
  maxTokens: 1000
```

---

### 5. Multi-Format Export

Export reports to HTML, PDF, or MDX:

```
import { HtmlExporter, PdfExporter, MdxExporter } from '@aganitha/dproc';

// Export to HTML
await new HtmlExporter().export('report.md', 'report.html', {
  title: 'My Report',
  includeBootstrap: true,
  includeTableOfContents: true,
});

// Export to PDF
await new PdfExporter().export('report.md', 'report.pdf', {
  format: 'A4',
  orientation: 'portrait',
});

// Export to MDX (for Next.js docs)
await new MdxExporter().export('report.md', 'report.mdx', {
  frontmatter: {
    title: 'My Report',
    date: '2024-01-01',
  },
});
```

---

## Complete Example

```
import {
  ConfigManager,
  ConnectorRegistry,
  BundleBuilder,
  SearchEngine,
  ReportEngine,
  HtmlExporter,
} from '@aganitha/dproc';

async function processData() {
  // 1. Configure
  ConfigManager.init({
    llm: {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      apiKey: process.env.GEMINI_API_KEY,
    },
    promptsDir: './prompts',
    templatesDir: './templates',
  });

  // 2. Ingest data
  const connector = ConnectorRegistry.getByFilePath('sales.csv');
  const records = await connector.read('sales.csv');

  // 3. Create bundle
  const bundle = BundleBuilder.create(records, {
    source: 'sales-data',
    format: 'csv',
  });

  // 4. Search
  const results = await SearchEngine.query(
    bundle, 
    "What were sales in Q4?"
  );
  console.log('Answer:', results.answer);
  console.log('Insights:', results.insights);

  // 5. Generate report
  await ReportEngine.generateAndSave(
    bundle,
    'quarterly-report.yaml',
    'q4-report.md'
  );

  // 6. Export to PDF
  await new HtmlExporter().export(
    'q4-report.md',
    'q4-report.html'
  );
}

processData().catch(console.error);
```

---

## Configuration

### LLM Providers

```
// Gemini (Google)
ConfigManager.init({
  llm: {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
  },
});

// OpenAI
ConfigManager.init({
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
  },
});

// DeepSeek
ConfigManager.init({
  llm: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    apiKey: process.env.DEEPSEEK_API_KEY,
  },
});
```

### Full Configuration

```
ConfigManager.init({
  llm: {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.7,      // Default: 0.7
    maxTokens: 2000,       // Default: 2000
  },
  promptsDir: './prompts',      // Optional
  templatesDir: './templates',  // Optional
  bundlesDir: './bundles',      // Optional
});
```

---

## API Reference

### ConfigManager

```
// Initialize configuration
ConfigManager.init(config: DataProcessorConfig): void

// Get configuration
ConfigManager.getLlmConfig(): LlmConfig | null
ConfigManager.getPromptsDir(): string | undefined
ConfigManager.getTemplatesDir(): string | undefined
ConfigManager.getBundlesDir(): string | undefined
```

### ConnectorRegistry

```
// Get connector by file extension
ConnectorRegistry.getByExtension(ext: string): BaseConnector

// Get connector by file path
ConnectorRegistry.getByFilePath(path: string): BaseConnector

// Register custom connector
ConnectorRegistry.register(connector: BaseConnector): void
```

### BundleBuilder

```
// Create bundle from records
BundleBuilder.create(
  records: Record<string, any>[],
  metadata: Partial<BundleMetadata>
): UniversalBundle
```

### BundleLoader

```
// Save bundle to file
BundleLoader.save(bundle: UniversalBundle, path: string): Promise<void>

// Load bundle from file
BundleLoader.load(path: string): Promise<UniversalBundle>
```

### SearchEngine

```
// Natural language search
SearchEngine.query(
  bundle: UniversalBundle,
  query: string,
  options?: SearchOptions
): Promise<SearchResult>

// Raw search (no LLM insights)
SearchEngine.queryRaw(
  bundle: UniversalBundle,
  query: string,
  options?: SearchOptions
): Promise<Record<string, any>[]>
```

### ReportEngine

```
// Generate report
ReportEngine.generate(
  bundle: UniversalBundle,
  specPath: string
): Promise<GeneratedReport>

// Generate and save
ReportEngine.generateAndSave(
  bundle: UniversalBundle,
  specPath: string,
  outputPath: string
): Promise<GeneratedReport>

// Generate with custom variables
ReportEngine.generateCustom(
  specPath: string,
  variables: Record<string, any>
): Promise<GeneratedReport>
```

### Exporters

```
// HTML Export
new HtmlExporter().export(
  inputPath: string,
  outputPath: string,
  options?: HtmlExportOptions
): Promise<ExportResult>

// PDF Export
new PdfExporter().export(
  inputPath: string,
  outputPath: string,
  options?: PdfExportOptions
): Promise<ExportResult>

// MDX Export
new MdxExporter().export(
  inputPath: string,
  outputPath: string,
  options?: MdxExportOptions
): Promise<ExportResult>
```

---

## Known Limitations

Since this is a **training project**, be aware of:

### ⚠️ Performance
- No query optimization
- Loads entire dataset into memory
- Streaming only partially implemented
- Not tested with datasets > 100K records

### ⚠️ Security
- No input validation on LLM prompts
- No sanitization of user queries
- API keys stored in plain text
- No rate limiting

### ⚠️ Reliability
- Limited error handling
- No retry mechanisms (except basic)
- No transaction support
- No data validation

### ⚠️ Features
- Basic search operators only
- Limited report customization
- No incremental updates
- No caching

### ⚠️ Testing
- No unit tests
- No integration tests
- No performance benchmarks
- Manual testing only

---

## Development Status

| Feature | Status | Notes |
|---------|--------|-------|
| CSV/JSON Connectors | ✅ Working | Basic functionality |
| XML/Parquet Connectors | ⚠️ Limited | Not thoroughly tested |
| Bundle Creation | ✅ Working | Stats computation works |
| LLM Integration | ✅ Working | Gemini tested, others untested |
| Search | ⚠️ Partial | Basic queries work |
| Reports | ⚠️ Partial | Simple templates only |
| Exports | ⚠️ Partial | PDF may be slow |

---

## Project Context

**Purpose:** Built as a learning exercise to understand:
- TypeScript package architecture
- LLM SDK integration patterns
- Data processing pipeline design
- Streaming large files
- Template-based report generation

**Timeline:** Developed in one session (November 26-27, 2025)

**Author:** Built during TypeScript/LLM training at Aganitha Cognitive Solutions

**Not Suitable For:**
- ❌ Production data processing
- ❌ Sensitive or confidential data
- ❌ Mission-critical workflows
- ❌ Large-scale deployments
- ❌ Customer-facing applications

**Good For:**
- ✅ Learning TypeScript patterns
- ✅ Prototyping ideas
- ✅ Educational demonstrations
- ✅ Understanding LLM integration
- ✅ Architecture exploration

---

## Future Improvements (If Continued)

To make this production-ready, would need:

1. **Testing:** Full test suite (unit, integration, e2e)
2. **Security:** Input validation, sanitization, secrets management
3. **Performance:** Query optimization, caching, lazy loading
4. **Reliability:** Error handling, retries, transactions
5. **Documentation:** Full API docs, tutorials, examples
6. **Features:** Advanced search, complex reports, data validation
7. **Monitoring:** Logging, metrics, error tracking
8. **Deployment:** Docker, CI/CD, health checks

---

## Contributing

Since this is a training project, contributions are welcome for learning purposes:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

**Please note:** This project is not actively maintained for production use.

---

## License

MIT License - See LICENSE file

**Disclaimer:** This software is provided "as is" for educational purposes. Use at your own risk.

---

## Support

For questions or issues:
- 📧 Email: mdharwad@aganitha.ai

**Remember:** This is a training project - please use responsibly!

---

## Acknowledgments

Built using:
- [Vercel AI SDK](https://sdk.vercel.ai/) - LLM integration
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Nunjucks](https://mozilla.github.io/nunjucks/) - Templating
- [Puppeteer](https://pptr.dev/) - PDF generation
- [Marked](https://marked.js.org/) - Markdown parsing

---

**Version:** 1.0.1 (Training Release)  
**Status:** 🎓 Educational / Not Production Ready  
**Last Updated:** November 27, 2025