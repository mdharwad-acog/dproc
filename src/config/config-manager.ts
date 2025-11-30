import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { cwd } from "node:process";
import { homedir } from "node:os";
import { join } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { config as loadDotenv } from "dotenv";
import { createLogger } from "../utils/logger.js";
import { keytarAdapter } from "./keytar-adapter.js";
import {
  safeParseDprocConfig,
  type DprocConfig,
  type LlmConfig,
} from "./schema.js";

const log = createLogger("core:config");

export class ConfigManager {
  private static config: DprocConfig | null = null;
  private static configDir = join(homedir(), ".dproc");
  private static globalJsonConfigPath = join(
    ConfigManager.configDir,
    "config.json"
  );
  private static globalYamlConfigPath = join(
    ConfigManager.configDir,
    "config.yml"
  );
  private static projectYamlConfigPath = join(cwd(), "dproc.config.yml");
  private static envLoaded = false;

  /**
   * Load .env file if it exists
   */
  private static loadEnvFile(): void {
    if (this.envLoaded) return;

    const envPath = join(cwd(), ".env");
    if (existsSync(envPath)) {
      loadDotenv({ path: envPath });
      log.debug("Loaded .env file from: %s", envPath);
    }
    this.envLoaded = true;
  }

  /**
   * Initialize configuration with validation
   */
  static init(config: DprocConfig): void {
    log.debug("Initializing configuration");

    // Validate config
    const result = safeParseDprocConfig(config);
    if (!result.success) {
      log.error("Configuration validation failed: %O", result.error.format());
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    this.config = this.expandEnvVars(result.data);
    log.info(
      "Config initialized: provider=%s, model=%s",
      this.config.llm?.provider,
      this.config.llm?.model
    );
  }

  /**
   * Load configuration from multiple sources with priority:
   * 1. Environment variables
   * 2. Project config (dproc.config.yml)
   * 3. Global config (~/.dproc/config.yml or config.json)
   * 4. Keytar (for API keys)
   */
  static async load(): Promise<DprocConfig> {
    log.debug("Loading configuration from multiple sources");

    // Load .env first
    this.loadEnvFile();

    try {
      let config: DprocConfig = {};

      // 1. Try project-level YAML config
      if (existsSync(this.projectYamlConfigPath)) {
        log.debug("Loading project config: %s", this.projectYamlConfigPath);
        const content = await readFile(this.projectYamlConfigPath, "utf-8");
        config = parseYaml(content) as DprocConfig;
        log.info("Loaded project YAML config");
      }
      // 2. Try global YAML config
      else if (existsSync(this.globalYamlConfigPath)) {
        log.debug("Loading global YAML config: %s", this.globalYamlConfigPath);
        const content = await readFile(this.globalYamlConfigPath, "utf-8");
        config = parseYaml(content) as DprocConfig;
        log.info("Loaded global YAML config");
      }
      // 3. Fallback to global JSON config (legacy)
      else if (existsSync(this.globalJsonConfigPath)) {
        log.debug("Loading global JSON config: %s", this.globalJsonConfigPath);
        const content = await readFile(this.globalJsonConfigPath, "utf-8");
        config = JSON.parse(content) as DprocConfig;
        log.info("Loaded global JSON config");
      }

      // Expand environment variables
      config = this.expandEnvVars(config);

      // Load API keys from keytar if available
      if (config.llm) {
        const apiKey = await this.getApiKey(config.llm.provider);
        if (apiKey) {
          config.llm.apiKey = apiKey;
          log.debug(
            "API key loaded from keytar for provider: %s",
            config.llm.provider
          );
        }
      }

      // Validate final config
      const result = safeParseDprocConfig(config);
      if (!result.success) {
        log.error("Configuration validation failed: %O", result.error.format());
        throw new Error(`Invalid configuration: ${result.error.message}`);
      }

      this.config = result.data;
      return result.data;
    } catch (error: any) {
      log.error("Failed to load config: %O", error);
      throw error;
    }
  }

  /**
   * Save configuration to global config file with validation
   */
  static async save(
    config: DprocConfig,
    format: "yaml" | "json" = "yaml"
  ): Promise<void> {
    log.debug("Saving configuration");

    // Validate before saving
    const result = safeParseDprocConfig(config);
    if (!result.success) {
      log.error("Cannot save invalid configuration: %O", result.error.format());
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    try {
      await mkdir(this.configDir, { recursive: true });

      // Don't save API keys in config files - they should be in keytar
      const configToSave = { ...result.data };
      if (configToSave.llm?.apiKey) {
        const { apiKey, ...llmWithoutKey } = configToSave.llm;
        configToSave.llm = llmWithoutKey as any;
        log.debug("API key excluded from config file (use keytar instead)");
      }

      if (format === "yaml") {
        const content = stringifyYaml(configToSave);
        await writeFile(this.globalYamlConfigPath, content, "utf-8");
        log.info("Config saved to: %s", this.globalYamlConfigPath);
      } else {
        const content = JSON.stringify(configToSave, null, 2);
        await writeFile(this.globalJsonConfigPath, content, "utf-8");
        log.info("Config saved to: %s", this.globalJsonConfigPath);
      }
    } catch (error: any) {
      log.error("Failed to save config: %O", error);
      throw new Error(`Failed to save config: ${error.message}`);
    }
  }

  /**
   * Update configuration (merge with existing)
   */
  static async update(partial: Partial<DprocConfig>): Promise<void> {
    log.debug("Updating configuration");
    const current = await this.load();
    const updated = { ...current, ...partial };

    // Detect which format to use based on which file exists
    const format = existsSync(this.globalYamlConfigPath)
      ? "yaml"
      : existsSync(this.globalJsonConfigPath)
      ? "json"
      : "yaml";

    await this.save(updated, format);
  }

  /**
   * Set API key securely in keytar
   */
  static async setApiKey(provider: string, apiKey: string): Promise<void> {
    log.debug("Storing API key for provider: %s", provider);
    try {
      await keytarAdapter.setPassword(`apikey-${provider}`, apiKey);
      log.info("API key stored securely for: %s", provider);
    } catch (error: any) {
      log.error("Failed to store API key: %O", error);
      throw new Error(`Failed to store API key: ${error.message}`);
    }
  }

  /**
   * Get API key from keytar or environment variable
   * Priority: 1. Keytar, 2. Environment variable
   */
  static async getApiKey(provider: string): Promise<string | null> {
    log.debug("Retrieving API key for provider: %s", provider);

    // Try keytar first
    try {
      const apiKey = await keytarAdapter.getPassword(`apikey-${provider}`);
      if (apiKey) {
        return apiKey;
      }
    } catch (error: any) {
      log.warn("Failed to retrieve from keytar: %O", error);
    }

    // Fallback to environment variables
    const envVarName = `${provider.toUpperCase()}_API_KEY`;
    const envKey = process.env[envVarName];
    if (envKey) {
      log.debug("Using API key from environment: %s", envVarName);
      return envKey;
    }

    log.warn("No API key found for provider: %s", provider);
    return null;
  }

  /**
   * Delete API key from keytar
   */
  static async deleteApiKey(provider: string): Promise<boolean> {
    log.debug("Deleting API key for provider: %s", provider);
    try {
      const result = await keytarAdapter.deletePassword(`apikey-${provider}`);
      if (result) {
        log.info("API key deleted for: %s", provider);
      }
      return result;
    } catch (error: any) {
      log.error("Failed to delete API key: %O", error);
      return false;
    }
  }

  /**
   * List all stored API keys (returns provider names only)
   */
  static async listApiKeys(): Promise<string[]> {
    log.debug("Listing stored API keys");
    try {
      const credentials = await keytarAdapter.findCredentials();
      const providers = credentials
        .map((c) => c.account)
        .filter((account) => account.startsWith("apikey-"))
        .map((account) => account.replace("apikey-", ""));
      log.debug("Found API keys for providers: %O", providers);
      return providers;
    } catch (error: any) {
      log.error("Failed to list API keys: %O", error);
      return [];
    }
  }

  /**
   * Get LLM configuration
   */
  static getLlmConfig(): LlmConfig | undefined {
    return this.config?.llm;
  }

  /**
   * Get templates directory
   */
  static getTemplatesDir(): string | undefined {
    return this.config?.templates?.customDir;
  }

  /**
   * Get prompts directory
   */
  static getPromptsDir(): string | undefined {
    return this.config?.prompts?.customDir;
  }

  /**
   * Get configuration directory path
   */
  static getConfigDir(): string {
    return this.configDir;
  }

  /**
   * Get default report options
   */
  static getReportDefaults(): {
    outputDir?: string;
  } {
    return {
      outputDir:
        this.config?.reports?.defaultOutputDir || this.config?.defaultOutputDir,
    };
  }

  /**
   * Get default search options
   */
  static getSearchDefaults(): {
    limit?: number;
    temperature?: number;
  } {
    return {
      limit: this.config?.search?.defaultLimit,
      temperature: this.config?.search?.temperature,
    };
  }

  /**
   * Get default export options
   */
  static getExportDefaults(): {
    formats?: string[];
    includeTableOfContents?: boolean;
  } {
    return {
      formats: this.config?.export?.defaultFormats,
      includeTableOfContents: this.config?.export?.includeTableOfContents,
    };
  }

  /**
   * Expand environment variables in config
   * Supports ${VAR} and $VAR syntax
   */
  private static expandEnvVars(config: DprocConfig): DprocConfig {
    const expanded = JSON.parse(
      JSON.stringify(config, (_, value) => {
        if (typeof value === "string") {
          // Replace ${VAR} and $VAR with process.env.VAR
          return value.replace(
            /\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/g,
            (_, g1, g2) => {
              const varName = g1 || g2;
              return process.env[varName] || "";
            }
          );
        }
        return value;
      })
    );
    return expanded;
  }

  /**
   * Validate current configuration
   */
  static validate(): { valid: boolean; errors?: any } {
    if (!this.config) {
      return { valid: false, errors: "No configuration loaded" };
    }

    const result = safeParseDprocConfig(this.config);
    if (!result.success) {
      return {
        valid: false,
        errors: result.error.format(),
      };
    }

    return { valid: true };
  }
}
