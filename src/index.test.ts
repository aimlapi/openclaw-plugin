import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OpenClawPluginApi, ProviderPlugin } from "openclaw/plugin-sdk/plugin-entry";
import entry from "./index.js";

type WebSearchProvider = Parameters<OpenClawPluginApi["registerWebSearchProvider"]>[0];
type VideoProvider = Parameters<OpenClawPluginApi["registerVideoGenerationProvider"]>[0];

const root = path.resolve(import.meta.dirname, "..");
const readJson = (file: string) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));

function register() {
  const providers: ProviderPlugin[] = [];
  const webSearch: WebSearchProvider[] = [];
  const video: VideoProvider[] = [];
  const api = {
    registerProvider: (provider: ProviderPlugin) => providers.push(provider),
    registerWebSearchProvider: (provider: WebSearchProvider) => webSearch.push(provider),
    registerVideoGenerationProvider: (provider: VideoProvider) => video.push(provider),
  } as Partial<OpenClawPluginApi>;
  entry.register(api as OpenClawPluginApi);
  return { providers, webSearch, video };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("aimlapi plugin entry", () => {
  it("registers the chat provider, web search and video generation", () => {
    const { providers, webSearch, video } = register();

    expect(providers.map((provider) => provider.id)).toEqual(["aimlapi"]);
    expect(providers[0]).toMatchObject({ label: "AI/ML API", envVars: ["AIMLAPI_API_KEY"] });
    expect(providers[0]?.auth).toMatchObject([{ id: "api-key", kind: "api_key" }]);
    expect(webSearch).toHaveLength(1);
    expect(webSearch[0]).toMatchObject({
      id: "aimlapi",
      authProviderId: "aimlapi",
      credentialPath: "plugins.entries.aimlapi.config.webSearch.apiKey",
      envVars: ["AIMLAPI_API_KEY"],
    });
    expect(video.map((provider) => provider.id)).toEqual(["aimlapi"]);
  });

  it("augments the model catalog from models.json without duplicating entries", async () => {
    const provider = register().providers[0];
    vi.spyOn(fsPromises, "readFile").mockResolvedValue(
      JSON.stringify({
        providers: {
          aimlapi: {
            models: [
              { id: "openai/gpt-5.6-terra", name: "GPT-5.6 Terra", input: ["text", "image"] },
              { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini", reasoning: false, input: ["text"] },
            ],
          },
        },
      }),
    );

    const entries = await provider?.augmentModelCatalog?.({
      agentDir: "/tmp/openclaw",
      env: process.env,
      entries: [{ provider: "aimlapi", id: "openai/gpt-5.6-terra", name: "GPT-5.6 Terra" }],
    } as Parameters<NonNullable<ProviderPlugin["augmentModelCatalog"]>>[0]);

    expect(entries).toEqual([
      {
        provider: "aimlapi",
        id: "openai/gpt-4.1-mini",
        name: "GPT-4.1 Mini",
        reasoning: false,
        input: ["text"],
      },
    ]);
  });
});

describe("plugin manifest", () => {
  const manifest = readJson("openclaw.plugin.json");
  const pkg = readJson("package.json");

  it("keeps manifest, package and entry versions in step", () => {
    expect(manifest.version).toBe(pkg.version);
    expect(manifest.id).toBe("aimlapi");
    expect(pkg.openclaw.extensions).toEqual(["./dist/index.js"]);
  });

  it("ships the AI/ML API MCP server over Streamable HTTP with the key from the environment", () => {
    expect(manifest.mcpServers).toEqual({
      aimlapi: {
        transport: "streamable-http",
        url: "https://mcp.aimlapi.com/mcp",
        headers: { Authorization: "Bearer ${AIMLAPI_API_KEY}" },
      },
    });
  });

  it("ships every skill of the pinned @ai-ml.api/skills release", () => {
    expect(manifest.skills).toEqual(["./skills"]);
    const source = readJson("skills/SOURCE.json");
    expect(source).toMatchObject(pkg.aimlapiSkills);
    const skills = fs
      .readdirSync(path.join(root, "skills"), { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    expect(skills.length).toBeGreaterThanOrEqual(13);
    for (const skill of skills) {
      expect(skill).toMatch(/^aimlapi-/);
      expect(fs.existsSync(path.join(root, "skills", skill, "SKILL.md"))).toBe(true);
    }
    expect(pkg.files).toContain("skills");
  });

  it("installs from ClawHub only (the @aimlapi npm scope is not ours)", () => {
    expect(pkg.openclaw.install).toEqual({
      clawhubSpec: "clawhub:@aimlapi/openclaw-provider",
      defaultChoice: "clawhub",
      minHostVersion: ">=2026.11.8",
    });
    expect(pkg.openclaw.install.npmSpec).toBeUndefined();
  });
});
