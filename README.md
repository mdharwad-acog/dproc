# dproc

> AI-powered data processing engine with multi-format connectors, LLM integration, natural language search, and intelligent reporting.

---

## Features

- 🔌 **Multi-Format Connectors** — CSV, JSON, XML, Parquet (with streaming)
- 📦 **Universal Bundles** — Normalized data with automatic stats
- 🤖 **LLM Integration** — Gemini, OpenAI, DeepSeek support
- 📊 **AI Reports** — Template-based with LLM-powered insights
- 🔍 **Natural Language Search** — Query data with plain English
- 📄 **Multi-Format Export** — HTML, PDF, MDX output

---

## Installation

```bash
npm install dproc
````

---

## Quick Start

```ts
import {
  ConfigManager,
  ConnectorRegistry,
  BundleBuilder,
  SearchEngine,
  ReportEngine,
  HtmlExporter,
  PdfExporter
} from 'dproc';

// 1. Initialize
ConfigManager.init({
  llm: {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
  },
});

// 2. Ingest data
const connector = ConnectorRegistry.getByFilePath('data.csv');
const records = await connector.read('data.csv');

const bundle = BundleBuilder.create(records, {
  source: 'customer-data',
  format: 'csv',
});

// 3. Search with natural language
const results = await SearchEngine.query(bundle, "Find active users");
console.log(results.answer);          // AI-generated answer
console.log(results.insights);        // AI insights
console.log(results.matchingRecords); // Filtered data

// 4. Generate AI report
const report = await ReportEngine.generate(bundle, 'report-spec.yaml');

// 5. Export to multiple formats
await new HtmlExporter().export('report.md', 'report.html');
await new PdfExporter().export('report.md', 'report.pdf');
```

---

## Documentation

See full documentation:
👉 [https://github.com/aganitha/dproc#readme](https://github.com/aganitha/dproc#readme)

Includes:

* Connector usage
* Report specs
* Search queries
* Export options
* LLM configuration

---