import puppeteer from "puppeteer";
import { BaseExporter } from "./base-exporter.js";
import { HtmlExporter } from "./html-exporter.js";
import type { PdfExportOptions, ExportResult } from "./types.js";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path"; // ✅ Added resolve

/**
 * PDF Exporter - Converts Markdown to PDF via HTML
 */
export class PdfExporter extends BaseExporter {
  private htmlExporter: HtmlExporter;

  constructor() {
    super("pdf");
    this.htmlExporter = new HtmlExporter();
  }

  async export(
    inputPath: string,
    outputPath: string,
    options?: PdfExportOptions
  ): Promise<ExportResult> {
    this.log.info("Exporting %s to PDF: %s", inputPath, outputPath);

    let tempHtmlPath: string | null = null;

    try {
      // Step 1: Convert MD to HTML (in temp file)
      tempHtmlPath = join(tmpdir(), `dproc-temp-${Date.now()}.html`);

      const htmlResult = await this.htmlExporter.export(
        inputPath,
        tempHtmlPath,
        {
          title: options?.title,
          author: options?.author,
          date: options?.date,
          includeTableOfContents: options?.includeTableOfContents,
          watermark: options?.watermark,
        }
      );

      if (!htmlResult.success) {
        throw new Error("HTML generation failed");
      }

      // ✅ Convert to absolute path
      const absoluteTempPath = resolve(tempHtmlPath);
      const absoluteOutputPath = resolve(outputPath);

      // Step 2: Convert HTML to PDF using Puppeteer
      this.log.debug("Launching Puppeteer...");
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      // ✅ Load HTML file with absolute path
      await page.goto(`file://${absoluteTempPath}`, {
        waitUntil: "networkidle0",
      });

      // Generate PDF
      this.log.debug("Generating PDF...");
      await page.pdf({
        path: absoluteOutputPath,
        format: options?.format || "A4",
        landscape: options?.orientation === "landscape",
        margin: options?.margin || {
          top: "20mm",
          right: "15mm",
          bottom: "20mm",
          left: "15mm",
        },
        printBackground: true,
        displayHeaderFooter: options?.displayHeaderFooter ?? false,
        headerTemplate: options?.headerTemplate || "",
        footerTemplate: options?.footerTemplate || "",
      });

      await browser.close();

      this.log.info("PDF generated successfully");

      // Get file size
      const fs = await import("fs/promises");
      const stats = await fs.stat(absoluteOutputPath);

      return this.createResult(true, outputPath, stats.size);
    } catch (error: any) {
      this.log.error("Export failed: %O", error);
      return this.createResult(false, outputPath, undefined, error.message);
    } finally {
      // Clean up temp HTML file
      if (tempHtmlPath) {
        try {
          await unlink(tempHtmlPath);
          this.log.debug("Cleaned up temp file: %s", tempHtmlPath);
        } catch (e) {
          this.log.warn("Failed to clean up temp file: %s", tempHtmlPath);
        }
      }
    }
  }
}
