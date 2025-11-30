import { createLogger } from "../utils/logger.js";

const log = createLogger("core:keytar");

/**
 * Keytar adapter for secure credential storage
 * Uses system keychain (Windows Credential Manager, macOS Keychain, Linux Secret Service)
 */
export class KeytarAdapter {
  private keytar: any = null;
  private isAvailable = false;
  private serviceName = "dproc";

  constructor() {
    this.initialize();
  }

  /**
   * Initialize keytar (lazy loading)
   */
  private async initialize(): Promise<void> {
    try {
      // Dynamic import to handle optional dependency
      const keytarModule = await import("keytar");
      this.keytar = keytarModule.default || keytarModule;
      this.isAvailable = true;
      log.debug("Keytar initialized successfully");
    } catch (error) {
      log.warn("Keytar not available, falling back to environment variables");
      this.isAvailable = false;
    }
  }

  /**
   * Check if keytar is available
   */
  async isReady(): Promise<boolean> {
    if (!this.isAvailable) {
      await this.initialize();
    }
    return this.isAvailable;
  }

  /**
   * Set a credential in the system keychain
   */
  async setPassword(account: string, password: string): Promise<void> {
    if (!(await this.isReady())) {
      throw new Error(
        "Keytar is not available. Install keytar to use secure credential storage."
      );
    }

    try {
      await this.keytar.setPassword(this.serviceName, account, password);
      log.info("Credential stored securely: %s", account);
    } catch (error: any) {
      log.error("Failed to store credential: %O", error);
      throw new Error(`Failed to store credential: ${error.message}`);
    }
  }

  /**
   * Get a credential from the system keychain
   */
  async getPassword(account: string): Promise<string | null> {
    if (!(await this.isReady())) {
      return null;
    }

    try {
      const password = await this.keytar.getPassword(this.serviceName, account);
      if (password) {
        log.debug("Credential retrieved: %s", account);
      }
      return password;
    } catch (error: any) {
      log.error("Failed to retrieve credential: %O", error);
      return null;
    }
  }

  /**
   * Delete a credential from the system keychain
   */
  async deletePassword(account: string): Promise<boolean> {
    if (!(await this.isReady())) {
      return false;
    }

    try {
      const result = await this.keytar.deletePassword(
        this.serviceName,
        account
      );
      if (result) {
        log.info("Credential deleted: %s", account);
      }
      return result;
    } catch (error: any) {
      log.error("Failed to delete credential: %O", error);
      return false;
    }
  }

  /**
   * Find all credentials for this service
   */
  async findCredentials(): Promise<
    Array<{ account: string; password: string }>
  > {
    if (!(await this.isReady())) {
      return [];
    }

    try {
      const credentials = await this.keytar.findCredentials(this.serviceName);
      log.debug("Found %d credentials", credentials.length);
      return credentials;
    } catch (error: any) {
      log.error("Failed to find credentials: %O", error);
      return [];
    }
  }
}

// Singleton instance
export const keytarAdapter = new KeytarAdapter();
