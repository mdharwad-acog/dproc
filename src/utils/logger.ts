import createDebug from 'debug';

export interface Logger {
  debug: createDebug.Debugger;
  info: createDebug.Debugger;
  warn: createDebug.Debugger;
  error: createDebug.Debugger;
}

/**
 * Create namespaced logger
 * @param namespace - Logger namespace (e.g., 'core:connector:csv')
 */
export const createLogger = (namespace: string): Logger => {
  const base = `dproc:${namespace}`;
  
  return {
    debug: createDebug(`${base}`),
    info: createDebug(`${base}:info`),
    warn: createDebug(`${base}:warn`),
    error: createDebug(`${base}:error`),
  };
};