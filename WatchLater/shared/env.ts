export type RuntimeEnv = Record<string, string | undefined>;

type GlobalWithRuntimeEnv = typeof globalThis & {
  __WATCH_LATER_IMPORT_META_ENV__?: RuntimeEnv;
};

let cachedEnv: RuntimeEnv | null = null;

export const resolveRuntimeEnv = (): RuntimeEnv => {
  if (typeof globalThis !== 'undefined') {
    const globalWithRuntimeEnv = globalThis as GlobalWithRuntimeEnv;
    const injected = globalWithRuntimeEnv.__WATCH_LATER_IMPORT_META_ENV__;
    if (injected) {
      cachedEnv = injected;
      return injected;
    }
  }

  if (cachedEnv) {
    return cachedEnv;
  }

  if (typeof process !== 'undefined') {
    const nodeProcess = process as typeof process & { env?: RuntimeEnv };
    if (nodeProcess.env) {
      cachedEnv = nodeProcess.env;
      return cachedEnv;
    }
  }

  cachedEnv = {};
  return cachedEnv;
};
