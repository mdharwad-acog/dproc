import {
  HtmlExporter,
  PdfExporter,
  MdxExporter,
} from './dist/index.js';
import { writeFile } from 'node:fs/promises';

async function testExports() {
  console.log('\n=== Testing Exports Layer ===\n');

  // Create test markdown file
  const testMarkdown = `# Test Report

**Generated:** 2024-11-26

## Overview

This is a test report with some **bold** and *italic* text.

### Features

- Feature 1
- Feature 2
- Feature 3

### Data Table

| Name | Age | City |
|------|-----|------|
| John | 30  | NYC  |
| Jane | 25  | LA   |

\`\`\`javascript
console.log('Code block example');
\`\`\`

## Conclusion

This concludes the test report.
`;

  await writeFile('test-report-input.md', testMarkdown);
  console.log('✓ Created test markdown file\n');

  // Test HTML Export
  console.log('1. Testing HTML export...');
  const htmlExporter = new HtmlExporter();
  const htmlResult = await htmlExporter.export(
    'test-report-input.md',
    'test-report-output.html',
    {
      title: 'Test Report',
      author: 'dproc',
      date: '2024-11-26',
      includeTableOfContents: true,
      includeBootstrap: true,
    }
  );
  console.log('   Result:', htmlResult.success ? '✓' : '✗');
  console.log('   Output:', htmlResult.outputPath);
  console.log('   Size:', htmlResult.size, 'bytes\n');

  // Test PDF Export
  console.log('2. Testing PDF export...');
  console.log('   (This may take 10-15 seconds...)');
  const pdfExporter = new PdfExporter();
  const pdfResult = await pdfExporter.export(
    'test-report-input.md',
    'test-report-output.pdf',
    {
      title: 'Test Report',
      author: 'dproc',
      format: 'A4',
      orientation: 'portrait',
    }
  );
  console.log('   Result:', pdfResult.success ? '✓' : '✗');
  console.log('   Output:', pdfResult.outputPath);
  console.log('   Size:', pdfResult.size, 'bytes\n');

  // Test MDX Export
  console.log('3. Testing MDX export...');
  const mdxExporter = new MdxExporter();
  const mdxResult = await mdxExporter.export(
    'test-report-input.md',
    'test-report-output.mdx',
    {
      title: 'Test Report',
      author: 'dproc',
      frontmatter: {
        slug: 'test-report',
        tags: ['test', 'report'],
      },
      components: {
        Chart: '@/components/Chart',
        Table: '@/components/Table',
      },
    }
  );
  console.log('   Result:', mdxResult.success ? '✓' : '✗');
  console.log('   Output:', mdxResult.outputPath);
  console.log('   Size:', mdxResult.size, 'bytes\n');

  console.log('=== Exports Layer Tests Complete ===\n');
  console.log('Check the output files:');
  console.log('  - test-report-output.html');
  console.log('  - test-report-output.pdf');
  console.log('  - test-report-output.mdx\n');
}

testExports().catch(console.error);
