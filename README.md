# @aganitha/dproc

> 🎓 **Training Project** - AI-powered data processing engine built as a learning exercise

[![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)](https://npm.aganitha.ai/@aganitha/dproc)
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
- LLM integration for AI-powered reports (Gemini/OpenAI/DeepSeek)
- Natural language search over structured data
- Secure API key management with keytar
- Zod-based configuration validation
- Multi-format export (HTML, PDF, MDX)

**Built to learn:** Modern TypeScript patterns, AI SDK integration, secure credential storage, schema validation, and data pipeline architecture.

---

## Installation

Configure Aganitha private registry (one-time setup)
npm config set @aganitha:registry https://npm.aganitha.ai/

Install from Aganitha registry
npm install @aganitha/dproc

or
pnpm add @aganitha/dproc

**Prerequisites:**

- Node.js >= 18.0.0
- npm registry configured for @aganitha scope
- Gemini/OpenAI/DeepSeek API key (for LLM features)

---

## Quick Start

```javascript
import {
  ConfigManager,
  ConnectorRegistry,
  BundleBuilder,
  SearchEngine,
} from "@aganitha/dproc";

// 1. Initialize (required) - auto-loads from keytar/env/config files
ConfigManager.init({
  llm: {
    provider: "gemini",
    model: "gemini-1.5-flash",
    // apiKey auto-loaded from keytar or GEMINI_API_KEY env var
  },
});

// 2. Load data (auto-detects format from extension)
const connector = ConnectorRegistry.getByFilePath("data.csv");
const records = await connector.read("data.csv");

// 3. Create bundle with automatic statistics
const bundle = BundleBuilder.create(records, {
  source: "my-data",
  format: "csv",
});

// 4. Search with natural language
const results = await SearchEngine.query(bundle, "Find all active users");
console.log(results.answer); // AI-generated natural language answer
console.log(results.matchingRecords); // Filtered data
console.log(results.insights); // AI-generated insights
```

---

## Architecture

dproc is organized into 7 independent layers:

@aganitha/dproc
├── 1. Configuration Layer - ConfigManager, keytar, Zod validation
├── 2. Connectors Layer - CSV, JSON, XML, Parquet readers
├── 3. Bundles Layer - Normalized data format with statistics
├── 4. LLM Layer - AI SDK integration (Gemini/OpenAI/DeepSeek)
├── 5. Reports Layer - Template-driven report generation (Nunjucks)
├── 6. Search Layer - Natural language search with query planning
└── 7. Exports Layer - HTML, PDF, MDX output (Puppeteer)

Each layer is independent and can be used separately for modular development.

---

## Core Features

### 1. Data Connectors

Read multiple formats with automatic format detection:

```javascript
import {
  ConnectorRegistry,
  CsvConnector,
  ParquetConnector,
} from "@aganitha/dproc";

// Auto-detect format by file extension
const connector = ConnectorRegistry.getByFilePath("data.csv");
const records = await connector.read("data.csv");

// Or use specific connectors directly
const csvData = await new CsvConnector().read("sales.csv");
const parquetData = await new ParquetConnector().read("events.parquet");
```

**Supported formats:**

- CSV/TSV (with streaming for large files)
- JSON (with streaming)
- XML
- Parquet (with streaming)

**Registry methods:**
ConnectorRegistry.getByFilePath(path: string): BaseConnector
ConnectorRegistry.getByExtension(ext: string): BaseConnector

---

### 2. Bundles (Normalized Data)

Create universal data bundles with automatic field-level statistics:

```javascript
import { BundleBuilder, BundleLoader } from "@aganitha/dproc";

// Create bundle from records
const bundle = BundleBuilder.create(records, {
  source: "customer-data",
  format: "csv",
});

// Bundle automatically includes:
console.log(bundle.metadata); // Source, format, record count, timestamps
console.log(bundle.stats); // Field-level statistics (types, nulls, unique counts)
console.log(bundle.samples); // First records + random samples

// Persist bundles to disk
await BundleLoader.save(bundle, "customers.bundle.json");
const loaded = await BundleLoader.load("customers.bundle.json");
```

**Bundle structure:**

```javascript
{
metadata: {
source: string,
format: 'csv' | 'json' | 'xml' | 'parquet',
recordCount: number,
createdAt: string
},
records: Record<string, any>[],
stats: {
fieldStats: {
[fieldName]: {
type: string,
uniqueCount: number,
nullCount: number,
min?: any,
max?: any
}
}
},
samples: {
first: any[],
random: any[]
}
}
```

---

### 3. Natural Language Search

Search data using plain English queries:

```javascript
import { SearchEngine } from "@aganitha/dproc";

const results = await SearchEngine.query(
  bundle,
  "Who are customers older than 30 in California?",
  { limit: 10 }
);

// Results include:
console.log(results.answer); // AI-generated natural language answer
console.log(results.insights); // ["50% of California customers are over 30", ...]
console.log(results.stats); // { average_age: 35.2, total: 42 }
console.log(results.matchingRecords); // Filtered data matching criteria
console.log(results.totalMatches); // 42
console.log(results.executionTimeMs); // Performance metrics
```

**How it works:**

1. LLM converts natural language → structured filter query
2. Query executor filters data using pure JavaScript (no database)
3. LLM analyzes results and generates insights + natural language answer

**Search options:**

```javascript
{
limit?: number; // Max results (default from config)
temperature?: number; // LLM creativity (default from config)
}
```

---

### 4. AI-Powered Reports

Generate reports using YAML specifications and Nunjucks templates:

```javascript
import { ReportEngine, AutoReportGenerator } from "@aganitha/dproc";

// Generate report from YAML spec
const report = await ReportEngine.generate(bundle, "report-spec.yaml");

console.log(report.content); // Generated Markdown report
console.log(report.variables); // All resolved variables
console.log(report.metadata); // Generation metadata

// Save directly to file
await ReportEngine.generateAndSave(
  bundle,
  "quarterly-report.yaml",
  "output/q4-report.md"
);

// Auto-generate report without spec (uses AI)
const autoReport = await AutoReportGenerator.generate(bundle, {
  style: "detailed",
  depth: "comprehensive",
});
```

**Report spec example** (report-spec.yaml):

```yml
id: summary-report
name: Customer Data Summary
templateFile: customer-summary.njk

variables:

name: recordCount
type: number
source: bundle

name: topCustomers
type: array
source: bundle

name: insights
type: markdown
source: llm
promptFile: generate-insights.prompt.md

options:
temperature: 0.7
maxTokens: 2000
```

**Variable sources:**

- `bundle` - Extract from bundle metadata/records
- `llm` - Generate using AI with custom prompts

---

### 5. Multi-Format Export

Export reports to HTML, PDF, or MDX:

```javascript
import { HtmlExporter, PdfExporter, MdxExporter } from "@aganitha/dproc";

// Export to HTML (with Bootstrap styling)
await new HtmlExporter().export("report.md", "report.html", {
  title: "Q4 Sales Report",
  includeBootstrap: true,
  includeTableOfContents: true,
});

// Export to PDF (using Puppeteer)
await new PdfExporter().export("report.md", "report.pdf", {
  format: "A4",
  orientation: "portrait",
});

// Export to MDX (for Next.js/Docusaurus)
await new MdxExporter().export("report.md", "report.mdx", {
  frontmatter: {
    title: "Q4 Sales Report",
    date: "2024-12-01",
    tags: ["sales", "quarterly"],
  },
});
```

**Export formats:**

- **HTML** - Styled with Bootstrap, includes table of contents
- **PDF** - Generated via Puppeteer headless Chrome
- **MDX** - For Next.js/Docusaurus documentation sites

---

## Complete Example

```javascript
import {
  ConfigManager,
  ConnectorRegistry,
  BundleBuilder,
  BundleLoader,
  SearchEngine,
  ReportEngine,
  HtmlExporter,
  PdfExporter,
} from "@aganitha/dproc";

async function analyzeData() {
  // 1. Initialize configuration (auto-loads API keys)
  ConfigManager.init({
    llm: {
      provider: "gemini",
      model: "gemini-1.5-flash",
      // apiKey auto-loaded from keytar or env
    },
  });

  // 2. Load and ingest data
  const connector = ConnectorRegistry.getByFilePath("sales-2024.csv");
  const records = await connector.read("sales-2024.csv");

  // 3. Create and save bundle
  const bundle = BundleBuilder.create(records, {
    source: "annual-sales",
    format: "csv",
  });
  await BundleLoader.save(bundle, "bundles/sales-2024.bundle.json");

  // 4. Natural language search
  const q4Results = await SearchEngine.query(
    bundle,
    "What were total sales in Q4 by region?"
  );
  console.log("Answer:", q4Results.answer);
  console.log("Insights:", q4Results.insights);
  console.log("Stats:", q4Results.stats);

  // 5. Generate comprehensive report
  await ReportEngine.generateAndSave(
    bundle,
    "specs/annual-report.yaml",
    "output/annual-sales-report.md"
  );

  // 6. Export to multiple formats
  await new HtmlExporter().export(
    "output/annual-sales-report.md",
    "output/annual-sales-report.html"
  );

  await new PdfExporter().export(
    "output/annual-sales-report.md",
    "output/annual-sales-report.pdf"
  );
}

analyzeData().catch(console.error);
```

---

## Configuration

### Configuration Priority (Highest to Lowest)

1. **keytar** - Secure system keychain (`apikey-gemini`, `apikey-openai`, `apikey-deepseek`)
2. **Environment variables** - `GEMINI_API_KEY`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`
3. **Project config** - `dproc.config.yml` (in current directory)
4. **Global config** - `~/.dproc/config.yml` or `~/.dproc/config.json`

### LLM Provider Configuration

```javascript
// Gemini (Google) - Recommended for learning
ConfigManager.init({
  llm: {
    provider: "gemini",
    model: "gemini-1.5-flash", // or 'gemini-1.5-pro'
    // apiKey auto-loaded
  },
});

// OpenAI
ConfigManager.init({
  llm: {
    provider: "openai",
    model: "gpt-4o-mini", // or 'gpt-4', 'gpt-4o'
  },
});

// DeepSeek
ConfigManager.init({
  llm: {
    provider: "deepseek",
    model: "deepseek-chat", // or 'deepseek-reasoner'
  },
});
```

### Full Configuration Example

```javascript
ConfigManager.init({
  llm: {
    provider: "gemini",
    model: "gemini-1.5-flash",
    apiKey: process.env.GEMINI_API_KEY, // or auto-loaded
    temperature: 0.7, // LLM creativity (0-1)
    maxTokens: 2000, // Response length
  },
  templates: {
    customDir: "./templates", // Custom Nunjucks templates
  },
  prompts: {
    customDir: "./prompts", // Custom LLM prompts
  },
  defaultOutputDir: "./output",
  search: {
    defaultLimit: 10,
    temperature: 0.7,
  },
  export: {
    defaultFormats: ["html", "pdf"],
    includeTableOfContents: true,
  },
});
```

### Secure API Key Management (New in v1.0.2)

```javascript
// Store API key securely in system keychain
await ConfigManager.setApiKey("gemini", "your-api-key-here");

// Retrieve API key (auto-tries keytar, then env, then config)
const apiKey = await ConfigManager.getApiKey("gemini");

// List all stored providers
const providers = await ConfigManager.listApiKeys(); // ['gemini', 'openai']

// Delete API key
await ConfigManager.deleteApiKey("openai");
```

---

## API Reference

### ConfigManager

```javascript
// Initialize in-memory configuration
ConfigManager.init(config: DprocConfig): void

// Load from files/env/keytar (priority: project → global → keytar)
await ConfigManager.load(): Promise<DprocConfig>

// Save to global config file
await ConfigManager.save(config: DprocConfig, format?: 'yaml'|'json'): Promise<void>

// Update existing configuration
await ConfigManager.update(partial: Partial<DprocConfig>): Promise<void>

// Secure API key management (keytar)
await ConfigManager.setApiKey(provider: string, key: string): Promise<void>
await ConfigManager.getApiKey(provider: string): Promise<string | null>
await ConfigManager.deleteApiKey(provider: string): Promise<boolean>
await ConfigManager.listApiKeys(): Promise<string[]>

// Configuration getters
ConfigManager.getLlmConfig(): LlmConfig | undefined
ConfigManager.getTemplatesDir(): string | undefined
ConfigManager.getPromptsDir(): string | undefined
ConfigManager.getConfigDir(): string
ConfigManager.getReportDefaults(): { outputDir?: string }
ConfigManager.getSearchDefaults(): { limit?: number; temperature?: number }
ConfigManager.getExportDefaults(): { formats?: string[]; includeTableOfContents?: boolean }

// Validation
ConfigManager.validate(): { valid: boolean; errors?: any }
```

### ConnectorRegistry & Connectors

```javascript
// Registry methods
ConnectorRegistry.getByFilePath(path: string): BaseConnector
ConnectorRegistry.getByExtension(ext: string): BaseConnector

// Individual connector classes
new CsvConnector().read(path: string): Promise<Record<string, any>[]>
new JsonConnector().read(path: string): Promise<Record<string, any>[]>
new XmlConnector().read(path: string): Promise<Record<string, any>[]>
new ParquetConnector().read(path: string): Promise<Record<string, any>[]>

### BundleBuilder & BundleLoader

// Create bundle with metadata and statistics
BundleBuilder.create(
records: Record<string, any>[],
metadata: Partial<BundleMetadata>
): UniversalBundle

// Save/load bundles
await BundleLoader.save(bundle: UniversalBundle, path: string): Promise<void>
await BundleLoader.load(path: string): Promise<UniversalBundle>

### SearchEngine

// Natural language search
await SearchEngine.query(
bundle: UniversalBundle,
query: string,
options?: SearchOptions
): Promise<SearchResult>

// Internal components (advanced usage)
SearchPlanner.plan(query: string, bundle: UniversalBundle): Promise<SearchPlan>
QueryExecutor.execute(plan: SearchPlan, bundle: UniversalBundle): any[]
ResultConsolidator.consolidate(results: any[], query: string): Promise<SearchResult>

### ReportEngine

// Generate from YAML spec
await ReportEngine.generate(
bundle: UniversalBundle,
specPath: string
): Promise<GeneratedReport>

// Generate and save
await ReportEngine.generateAndSave(
bundle: UniversalBundle,
specPath: string,
outputPath: string
): Promise<GeneratedReport>

// Auto-generate (no spec required)
await AutoReportGenerator.generate(
bundle: UniversalBundle,
options?: ReportGenerateOptions
): Promise<GeneratedReport>

### Exporters

// HTML Export
await new HtmlExporter().export(
inputPath: string,
outputPath: string,
options?: HtmlExportOptions
): Promise<ExportResult>

// PDF Export
await new PdfExporter().export(
inputPath: string,
outputPath: string,
options?: PdfExportOptions
): Promise<ExportResult>

// MDX Export
await new MdxExporter().export(
inputPath: string,
outputPath: string,
options?: MdxExportOptions
): Promise<ExportResult>

### LLM Client (Advanced)

// Get singleton instance (auto-configured from ConfigManager)
const llm = LlmClient.getInstance();

// Generate text
const result = await llm.generate(
messages: LlmMessage[],
options?: LlmGenerateOptions
): Promise<LlmGenerateResult>

// Stream responses
const stream = await llm.stream(
messages: LlmMessage[],
options?: LlmGenerateOptions
): AsyncIterable<LlmStreamChunk>

// Load and render prompts
const prompt = await PromptLoader.load('prompt-template.md');
const rendered = await PromptRenderer.render('template.md', { variable: 'value' });
```

---

## CLI Companion Tool

For command-line workflows, install the companion CLI:

```shell
npm install -g @aganitha/dproc-cli

Interactive setup
dproc init

Workflow
dproc ingest sales.csv # → bundle
dproc search bundle.json "top 10" # → results
dproc report bundle.json spec.yaml # → markdown
dproc export report.md report.pdf pdf
```

See [@aganitha/dproc-cli](https://npm.aganitha.ai/@aganitha/dproc-cli) documentation.

---

## Known Limitations

Since this is a **training project**, be aware of:

### ⚠️ Performance

- Loads entire dataset into memory (no database)
- No query optimization or indexing
- Streaming only partially implemented
- Not tested with datasets > 100K records
- LLM calls can be slow for large datasets

### ⚠️ Security

- Basic input validation only
- API keys stored in keytar (secure) or environment variables
- No sanitization of LLM prompts
- No rate limiting on API calls
- No audit logging

### ⚠️ Reliability

- Limited error handling and recovery
- No retry mechanisms for failed LLM calls
- No transaction support for multi-step operations
- Manual testing only (no automated tests)

### ⚠️ Features

- Basic search operators only (no complex joins)
- Limited report customization options
- No incremental bundle updates
- No result caching
- PDF generation can be slow (uses Puppeteer)

### ⚠️ Testing

- No unit test suite
- No integration tests
- No performance benchmarks
- No CI/CD pipeline

---

## Development Status

| Component              | Status     | Notes                   |
| ---------------------- | ---------- | ----------------------- |
| CSV/JSON Connectors    | ✅ Working | Streaming support       |
| XML/Parquet Connectors | ⚠️ Basic   | Limited testing         |
| Bundle Creation        | ✅ Working | Full statistics         |
| ConfigManager + keytar | ✅ Working | Secure storage          |
| LLM Integration        | ✅ Working | All 3 providers tested  |
| Search Engine          | ✅ Working | NL → structured queries |
| Report Generation      | ⚠️ Basic   | YAML specs working      |
| HTML/PDF Export        | ⚠️ Basic   | PDF can be slow         |
| Zod Validation         | ✅ Working | Full schema coverage    |

---

## Project Context

**Purpose:** Built as a learning exercise to understand:

- TypeScript package architecture and module patterns
- LLM SDK integration (Vercel AI SDK)
- Data processing pipeline design
- Streaming large files efficiently
- Template-based report generation
- Secure credential management (keytar)
- Schema validation with Zod

**Timeline:** Developed November 26-30, 2025

**Author:** Built during TypeScript/LLM training at Aganitha Cognitive Solutions

**Not Suitable For:**

- ❌ Production data processing
- ❌ Sensitive or confidential data
- ❌ Mission-critical workflows
- ❌ Large-scale deployments (>100K records)
- ❌ Customer-facing applications
- ❌ High-availability systems

**Good For:**

- ✅ Learning TypeScript patterns
- ✅ Prototyping data analysis ideas
- ✅ Educational demonstrations
- ✅ Understanding LLM integration
- ✅ Exploring data pipeline architecture
- ✅ Training on AI-powered workflows

---

## Future Improvements (If Continued)

To make this production-ready, would need:

1. **Testing:** Comprehensive test suite (unit, integration, e2e)
2. **Security:** Full input validation, prompt sanitization, secrets rotation
3. **Performance:** Database backend, query optimization, result caching
4. **Reliability:** Robust error handling, retry logic, transaction support
5. **Documentation:** Full API docs, tutorials, video guides
6. **Features:** Advanced search (joins, aggregations), complex reports
7. **Monitoring:** Logging, metrics, error tracking, alerting
8. **Deployment:** Docker images, Kubernetes configs, CI/CD pipeline
9. **Scalability:** Horizontal scaling, load balancing, queue systems

---

## Package Information

```json
{
  "name": "@aganitha/dproc",
  "version": "1.0.2",
  "description": "AI-powered data processing engine with multi-format connectors, LLM integration, natural language search, and intelligent reporting",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "publishConfig": {
    "registry": "https://npm.aganitha.ai/"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Published:** https://npm.aganitha.ai/@aganitha/dproc

**Key Dependencies:**

- `ai@5.0.102` - Vercel AI SDK for LLM integration
- `@ai-sdk/google@2.0.43` - Google Gemini provider
- `@ai-sdk/openai@2.0.72` - OpenAI provider
- `zod@4.1.13` - Schema validation
- `keytar@7.9.0` - Secure credential storage
- `csv-parse@6.1.0` - CSV parsing
- `fast-xml-parser@5.3.2` - XML parsing
- `parquetjs@0.11.2` - Parquet support
- `nunjucks@3.2.4` - Template engine
- `puppeteer@24.31.0` - PDF generation
- `marked@17.0.1` - Markdown parsing
- `yaml@2.8.1` - YAML configuration

---

## Development

Clone repository

```shell
git clone https://github.com/mdharwad-acog/dproc.git
cd dproc

Install dependencies
pnpm install

Build TypeScript
pnpm build

Development mode (watch)
pnpm dev

Clean build artifacts
pnpm clean

Run tests (vitest)
pnpm test

Publish to Aganitha registry
npm publish
```

**Build scripts:**

- `pnpm build` - Compile TypeScript to `dist/`
- `pnpm dev` - Watch mode with auto-rebuild
- `pnpm clean` - Remove `dist/` directory
- `pnpm test` - Run vitest test suite
- `pnpm prepublishOnly` - Clean + build before publish

---

## Contributing

Since this is a training project, contributions are welcome for learning purposes:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

**Please note:** This project is not actively maintained for production use. Contributions are for educational purposes only.

---

## Support

For questions or issues:

- 📧 Email: [mdharwad@aganitha.ai](mailto:mdharwad@aganitha.ai)
- 💬 GitHub Issues: [github.com/mdharwad-acog/dproc/issues](https://github.com/mdharwad-acog/dproc/issues)

**Remember:** This is a training project - please use responsibly and not for production workloads!

---

## Acknowledgments

Built using excellent open-source tools:

- [Vercel AI SDK](https://sdk.vercel.ai/) - LLM integration framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety and modern JavaScript
- [Zod](https://zod.dev/) - Schema validation
- [Nunjucks](https://mozilla.github.io/nunjucks/) - Templating engine
- [Puppeteer](https://pptr.dev/) - Headless Chrome for PDF generation
- [Marked](https://marked.js.org/) - Markdown parsing
- [keytar](https://github.com/atom/node-keytar) - Secure credential storage

Special thanks to the Aganitha training program for providing the learning opportunity.

---

**Repository:** https://github.com/mdharwad-acog/dproc  
**NPM Package:** https://npm.aganitha.ai/@aganitha/dproc  
**Version:** 1.0.2 (Training Release)  
**Status:** 🎓 Educational / Not Production Ready  
**Last Updated:** December 1, 2025
