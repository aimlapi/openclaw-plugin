/**
 * Type declarations for the OpenClaw plugin SDK subpaths this plugin uses that
 * the `openclaw` npm package ships as JavaScript only (no `.d.ts`).
 *
 * Every type here is derived from the typed public surface
 * (`openclaw/plugin-sdk/plugin-entry`), so a host change in those contracts
 * still breaks the typecheck. Only the helper function signatures are written
 * by hand, narrowed to how this plugin calls them; runtime presence of each
 * helper is checked by `src/sdk-runtime.test.ts` against the pinned host.
 */

declare module "openclaw/plugin-sdk/provider-onboard" {
  import type { ProviderPlugin } from "openclaw/plugin-sdk/plugin-entry";
  import type { OpenClawConfig as HostConfig } from "openclaw/plugin-sdk/account-core";

  type CatalogRun = NonNullable<ProviderPlugin["catalog"]>["run"];
  type CatalogResult = NonNullable<Awaited<ReturnType<CatalogRun>>>;
  type SingleProviderResult = Extract<CatalogResult, { provider: unknown }>;

  export type OpenClawConfig = HostConfig;
  export type ModelProviderConfig = SingleProviderResult["provider"];
  export type ModelDefinitionConfig = ModelProviderConfig["models"][number];

  export function createModelCatalogPresetAppliers(params: {
    primaryModelRef: string;
    resolveParams: () => {
      providerId: string;
      api: "openai-completions";
      baseUrl: string;
      catalogModels: ModelDefinitionConfig[];
      aliases?: Array<{ modelRef: string; alias: string }>;
    };
  }): {
    applyProviderConfig: (cfg: OpenClawConfig) => OpenClawConfig;
    applyConfig: (cfg: OpenClawConfig) => OpenClawConfig;
  };
}

declare module "openclaw/plugin-sdk/provider-catalog-shared" {
  import type { ProviderPlugin } from "openclaw/plugin-sdk/plugin-entry";
  import type { ModelProviderConfig } from "openclaw/plugin-sdk/provider-onboard";

  type CatalogRun = NonNullable<ProviderPlugin["catalog"]>["run"];

  export function buildSingleProviderApiKeyCatalog(params: {
    ctx: Parameters<CatalogRun>[0];
    providerId: string;
    buildProvider: () => ModelProviderConfig | Promise<ModelProviderConfig>;
  }): ReturnType<CatalogRun>;
}

declare module "openclaw/plugin-sdk/provider-auth-runtime" {
  import type { OpenClawConfig } from "openclaw/plugin-sdk/provider-onboard";

  export function resolveApiKeyForProvider(params: {
    provider: string;
    cfg?: OpenClawConfig;
    agentDir?: string;
    store?: unknown;
  }): Promise<{ apiKey?: string; source?: string; mode?: string } | null | undefined>;
}

declare module "openclaw/plugin-sdk/provider-http" {
  export function resolveProviderHttpRequestConfig(params: {
    baseUrl?: string;
    defaultBaseUrl: string;
    defaultHeaders?: Record<string, string>;
    provider?: string;
    capability?: string;
    transport?: string;
    allowPrivateNetwork?: boolean;
    request?: unknown;
  }): {
    baseUrl: string;
    allowPrivateNetwork?: boolean;
    headers: Headers;
    dispatcherPolicy?: unknown;
  };

  export function postJsonRequest(params: {
    url: string;
    headers: Headers | Record<string, string>;
    body: unknown;
    timeoutMs?: number;
    fetchFn?: typeof fetch;
    allowPrivateNetwork?: boolean;
    dispatcherPolicy?: unknown;
  }): Promise<{ response: Response; release: () => Promise<void> | void }>;

  export function fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number,
    fetchFn?: typeof fetch,
  ): Promise<Response>;

  export function assertOkOrThrowHttpError(response: Response, label: string): Promise<void>;
}

declare module "openclaw/plugin-sdk/video-generation" {
  import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

  export type VideoGenerationProvider = Parameters<
    OpenClawPluginApi["registerVideoGenerationProvider"]
  >[0];
  export type VideoGenerationRequest = Parameters<VideoGenerationProvider["generateVideo"]>[0];
  export type VideoGenerationResult = Awaited<ReturnType<VideoGenerationProvider["generateVideo"]>>;
  export type GeneratedVideoAsset = VideoGenerationResult["videos"][number];
}

declare module "openclaw/plugin-sdk/provider-web-search" {
  import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
  import type { OpenClawConfig } from "openclaw/plugin-sdk/provider-onboard";

  export type { OpenClawConfig };
  export type WebSearchProviderPlugin = Parameters<
    OpenClawPluginApi["registerWebSearchProvider"]
  >[0];
  export type WebSearchProviderToolDefinition = NonNullable<
    ReturnType<WebSearchProviderPlugin["createTool"]>
  >;
  export type SearchConfigRecord = Record<string, unknown>;

  export function buildSearchCacheKey(parts: unknown[]): string;
  export function readCachedSearchPayload(key: string): Record<string, unknown> | undefined;
  export function writeCachedSearchPayload(
    key: string,
    payload: Record<string, unknown>,
    ttlMs: number,
  ): void;
  export function resolveSearchCacheTtlMs(searchConfig?: SearchConfigRecord): number;
  export function resolveSearchTimeoutSeconds(searchConfig?: SearchConfigRecord): number;
  export function readConfiguredSecretString(value: unknown, path: string): string | undefined;
  export function readProviderEnvValue(envVars: string[]): string | undefined;
  export function readStringParam(
    params: Record<string, unknown>,
    key: string,
    options: { required: true },
  ): string;
  export function readStringParam(
    params: Record<string, unknown>,
    key: string,
    options?: { required?: boolean },
  ): string | undefined;
  export function readStringArrayParam(
    params: Record<string, unknown>,
    key: string,
  ): string[] | undefined;
  export function resolveProviderWebSearchPluginConfig(
    config: OpenClawConfig | undefined,
    pluginId: string,
  ): Record<string, unknown> | undefined;
  export function setProviderWebSearchPluginConfigValue(
    configTarget: OpenClawConfig,
    pluginId: string,
    key: string,
    value: unknown,
  ): void;
  export function setScopedCredentialValue(
    searchConfigTarget: Record<string, unknown>,
    key: string,
    value: unknown,
  ): void;
  export function withTrustedWebSearchEndpoint<T>(
    params: {
      url: string;
      timeoutSeconds: number;
      init: RequestInit;
    },
    run: (res: Response) => Promise<T>,
  ): Promise<T>;
  export function wrapWebContent(content: string): string;
}
