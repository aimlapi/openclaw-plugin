# AI/ML API plugin for OpenClaw

One AI/ML API key gives OpenClaw:

| Part | What you get |
| ---- | ------------ |
| Chat provider `aimlapi` | Every chat-completions model in the AI/ML API catalogue (300+), discovered live with context size, reasoning, vision and per-token prices |
| Web search | `web_search` through Perplexity Sonar-compatible models (default `perplexity/sonar-pro`) |
| Video generation | `aimlapi/...` video models, default `google/veo-3.1-t2v-fast` |
| MCP server | `https://mcp.aimlapi.com/mcp`: account balance, usage, models and the rest of the AI/ML API toolbox |
| Agent skills | 13 skills from [`@ai-ml.api/skills`](https://github.com/aimlapi/skills): chat, images, speech, video jobs, batch, webhooks, costs, errors, models, protocols, decisions, sandbox, setup |

Requires OpenClaw 2026.11.8 or newer.

## Install

```sh
openclaw plugins install clawhub:@aimlapi/openclaw-provider
openclaw onboard   # choose "AI/ML API key"
```

Get a key at [aimlapi.com](https://aimlapi.com/app/keys). The provider also reads `AIMLAPI_API_KEY` from the environment.

## MCP server

The plugin declares the AI/ML API MCP server as `aimlapi`, authenticated with `Authorization: Bearer ${AIMLAPI_API_KEY}`. Set `AIMLAPI_API_KEY` in the Gateway environment so the header resolves. A key saved only through `openclaw onboard` is not visible to MCP.

To sign in through the browser instead of a key:

```sh
openclaw mcp set aimlapi '{"url":"https://mcp.aimlapi.com/mcp","transport":"streamable-http","auth":"oauth"}'
openclaw mcp login aimlapi
```

`mcp.servers.aimlapi` in your config overrides the plugin default; set `"enabled": false` there to turn the server off. Sandbox keys cannot use MCP.

## Skills

Skills live in `skills/` and load while the plugin is enabled (`openclaw skills list` shows them as `aimlapi-*`). They are a pinned copy of an `@ai-ml.api/skills` release (`skills/SOURCE.json`), licensed Apache-2.0 (`skills/LICENSE`).

## Development

```sh
pnpm install
pnpm typecheck && pnpm test && pnpm build
pnpm check-skills                      # skills/ == pinned @ai-ml.api/skills release
pnpm exec clawhub package validate .   # ClawHub Plugin Inspector
```

To update the skills, change `aimlapiSkills.version` in `package.json` and run `pnpm sync-skills`; the script checks the npm tarball against the registry's sha512.

Every request carries the partner attribution headers `X-AIMLAPI-Source: agent/openclaw` and `X-AIMLAPI-Partner-ID`.
