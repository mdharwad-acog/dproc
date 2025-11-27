// dproc/src/config/config-manager.ts
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { cwd } from 'node:process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { createLogger } from '../utils/logger.js';
import type { DprocConfig, LlmConfig } from './types.js';

const log = createLogger('core:config');

export class ConfigManager {
  private static config: DprocConfig | null = null;
  private static configDir = join(homedir(), '.dproc');
  private static globalJsonConfigPath = join(ConfigManager.configDir, 'config.json');
  private static globalYamlConfigPath = join(ConfigManager.configDir, 'config.yml');
  private static projectYamlConfigPath = join(cwd(), 'dproc.config.yml');

  /**
   * Initialize configuration
   */
  static init(config: DprocConfig): void {
    log.debug('Initializing configuration');
    this.config = this.expandEnvVars(config);
    log.info('Config initialized: provider=%s, model=%s', 
      config.llm?.provider, 
      config.llm?.model
    );
  }

  /**
   * Load configuration from files (YAML first, then JSON fallback)
   * Load order: 
   * 1. dproc.config.yml (project root)
   * 2. ~/.dproc/config.yml (global YAML)
   * 3. ~/.dproc/config.json (global JSON, legacy)
   */
  static async load(): Promise<DprocConfig> {
    log.debug('Loading configuration from disk');

    try {
      // 1. Try project-level YAML config
      if (existsSync(this.projectYamlConfigPath)) {
        log.debug('Loading project config: %s', this.projectYamlConfigPath);
        const content = await readFile(this.projectYamlConfigPath, 'utf-8');
        const config = parseYaml(content) as DprocConfig;
        const expanded = this.expandEnvVars(config);
        log.info('Loaded project YAML config');
        return expanded;
      }

      // 2. Try global YAML config
      if (existsSync(this.globalYamlConfigPath)) {
        log.debug('Loading global YAML config: %s', this.globalYamlConfigPath);
        const content = await readFile(this.globalYamlConfigPath, 'utf-8');
        const config = parseYaml(content) as DprocConfig;
        const expanded = this.expandEnvVars(config);
        log.info('Loaded global YAML config');
        return expanded;
      }

      // 3. Fallback to global JSON config (legacy)
      if (existsSync(this.globalJsonConfigPath)) {
        log.debug('Loading global JSON config: %s', this.globalJsonConfigPath);
        const content = await readFile(this.globalJsonConfigPath, 'utf-8');
        const config = JSON.parse(content) as DprocConfig;
        const expanded = this.expandEnvVars(config);
        log.info('Loaded global JSON config');
        return expanded;
      }

      // No config found
      log.warn('No configuration file found');
      return {};

    } catch (error: any) {
      log.error('Failed to load config: %O', error);
      return {};
    }
  }

  /**
   * Save configuration to global config file
   * Default to YAML for new configs
   */
  static async save(config: DprocConfig, format: 'yaml' | 'json' = 'yaml'): Promise<void> {
    log.debug('Saving configuration');

    try {
      await mkdir(this.configDir, { recursive: true });

      if (format === 'yaml') {
        const content = stringifyYaml(config);
        await writeFile(this.globalYamlConfigPath, content, 'utf-8');
        log.info('Config saved to: %s', this.globalYamlConfigPath);
      } else {
        const content = JSON.stringify(config, null, 2);
        await writeFile(this.globalJsonConfigPath, content, 'utf-8');
        log.info('Config saved to: %s', this.globalJsonConfigPath);
      }

    } catch (error: any) {
      log.error('Failed to save config: %O', error);
      throw new Error(`Failed to save config: ${error.message}`);
    }
  }

  /**
   * Update configuration (merge with existing)
   */
  static async update(partial: Partial<DprocConfig>): Promise<void> {
    log.debug('Updating configuration');
    const current = await this.load();
    const updated = { ...current, ...partial };
    
    // Detect which format to use based on which file exists
    const format = existsSync(this.globalYamlConfigPath) ? 'yaml' : 
                   existsSync(this.globalJsonConfigPath) ? 'json' : 'yaml';
    
    await this.save(updated, format);
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
    style?: string;
    depth?: string;
    focus?: string[];
  } {
    return {
      style: this.config?.reports?.defaultStyle,
      depth: this.config?.reports?.defaultDepth,
      focus: this.config?.reports?.defaultFocus,
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
        if (typeof value === 'string') {
          // Replace ${VAR} and $VAR with process.env.VAR
          return value.replace(/\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/g, (_, g1, g2) => {
            const varName = g1 || g2;
            return process.env[varName] || '';
          });
        }
        return value;
      })
    );
    return expanded;
  }
}
