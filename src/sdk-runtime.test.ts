import { describe, expect, it } from "vitest";

// The SDK subpaths below ship without .d.ts in the openclaw npm package; their
// types live in src/types/openclaw-sdk.d.ts. This test pins that each helper
// the plugin calls still exists in the host version we build against.
const RUNTIME_HELPERS: Record<string, string[]> = {
  "openclaw/plugin-sdk/provider-onboard": ["createModelCatalogPresetAppliers"],
  "openclaw/plugin-sdk/provider-catalog-shared": ["buildSingleProviderApiKeyCatalog"],
  "openclaw/plugin-sdk/provider-auth-runtime": ["resolveApiKeyForProvider"],
  "openclaw/plugin-sdk/provider-http": [
    "assertOkOrThrowHttpError",
    "fetchWithTimeout",
    "postJsonRequest",
    "resolveProviderHttpRequestConfig",
  ],
  "openclaw/plugin-sdk/provider-web-search": [
    "buildSearchCacheKey",
    "readCachedSearchPayload",
    "readConfiguredSecretString",
    "readProviderEnvValue",
    "readStringArrayParam",
    "readStringParam",
    "resolveProviderWebSearchPluginConfig",
    "resolveSearchCacheTtlMs",
    "resolveSearchTimeoutSeconds",
    "setProviderWebSearchPluginConfigValue",
    "setScopedCredentialValue",
    "withTrustedWebSearchEndpoint",
    "wrapWebContent",
    "writeCachedSearchPayload",
  ],
};

describe("openclaw SDK runtime helpers", () => {
  for (const [subpath, names] of Object.entries(RUNTIME_HELPERS)) {
    it(`${subpath} exports ${names.length} helper(s)`, async () => {
      const mod = (await import(subpath)) as Record<string, unknown>;
      for (const name of names) {
        expect(typeof mod[name], `${subpath}#${name}`).toBe("function");
      }
    });
  }
});
