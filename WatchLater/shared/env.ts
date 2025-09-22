export type RuntimeEnv = Record<string, any>;

let cachedEnv: RuntimeEnv | null = null;

export const resolveRuntimeEnv = (): RuntimeEnv => {
  if (typeof globalThis !== 'undefined') {
    const injected = (globalThis as any).__WATCH_LATER_IMPORT_META_ENV__;
    if (injected) {
      cachedEnv = injected;
      return injected;
    }
  }

  if (cachedEnv) {
    return cachedEnv;
  }

  if (typeof process !== 'undefined' && (process as any).env) {
    cachedEnv = (process as any).env as RuntimeEnv;
    return cachedEnv;
  }

  cachedEnv = {};
  return cachedEnv;
};
