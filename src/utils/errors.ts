export class DprocError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DprocError';
  }
}

export class ConfigError extends DprocError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIG_ERROR', context);
    this.name = 'ConfigError';
  }
}

export class ValidationError extends DprocError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class IOError extends DprocError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'IO_ERROR', context);
    this.name = 'IOError';
  }
}

export class LLMError extends DprocError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'LLM_ERROR', context);
    this.name = 'LLMError';
  }
}
