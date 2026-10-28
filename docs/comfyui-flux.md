# Local FLUX.2 + ComfyUI, driven by Claude

Status: working on Kai's Mac (Apple Silicon, 64 GB). Claude Code can generate images locally via MCP; claude.ai can reach the same ComfyUI through a secured tunnel when it is running.

## Model
**FLUX.2 klein 4B**, delivered as split files, not a single checkpoint:
- UNET (diffusion model)
- CLIP / text encoder (loader type `flux2`)
- VAE — use the **BF16** VAE on Apple Silicon

Because there is no combined checkpoint, the generic "generate image" shortcut of an MCP server fails with an error like `ckpt_name 'put_checkpoints_here' not in []`. Use a hand-built workflow instead.

## Workflow nodes (API-format graph)
`UNETLoader` → `CLIPLoader (type: flux2)` → `VAELoader` → `CLIPTextEncode` (prompt) → `EmptyFlux2LatentImage` (width/height) → `Flux2Scheduler` → `KSamplerSelect` + `RandomNoise` + `BasicGuider` → `SamplerCustomAdvanced` → `VAEDecode` → `SaveImage`.

Export the working graph as API JSON into `tools/comfyui/workflows/` so Claude can submit it through the MCP "enqueue workflow" tool and swap prompt / size / seed.

## MCP servers
| Server | Use |
|---|---|
| `comfy-mcp` (Comfy-Org) | Official-style ComfyUI MCP |
| `comfyui-mcp` (artokun) | Has a built-in `--tunnel` option |

Notes from testing:
- Tool actions may be restricted by an allow-list env var (e.g. `COMFYUI_MCP_TOOL_ACTION_ALLOW`). Downloading a file via the `get` action was blocked; use asset listing + `view` to look at images, and read output files from ComfyUI's output folder on the Mac.
- Restart the MCP/tunnel after changing env vars.

## Reaching it from claude.ai (cloud chat)
claude.ai custom connectors accept **OAuth or beta request headers only** — no arbitrary bearer-token header — so a plain bearer-protected tunnel does not work out of the box. Practical options:
1. **ngrok with a secret path** — put a long random string in the URL path and a traffic policy that rejects everything else. Obscurity plus rate limiting; fine for a personal setup, not for sensitive data.
2. **ngrok traffic policy** with OAuth/IP restrictions in front of the MCP endpoint.
3. Tunnel built into `artokun/comfyui-mcp` (`--tunnel`).

Rules:
- Only run the tunnel while working; stop it afterwards (`ilyra-remote-stop` / `ilyra-remote-start` helpers on Kai's machine).
- Keep tokens and the secret path in `.env`, never in the repo.
- If the connector shows "No valid session: first request must be an initialize request" or fails to connect with a 404, the tunnel URL changed or the server restarted: restart the tunnel, then remove and re-add the connector in claude.ai Settings → Connectors.

## Reference images
Claude Code can pass reference images into a workflow via ComfyUI image-input nodes (`LoadImage` + a conditioning path suited to FLUX.2). Check which reference-conditioning nodes the installed ComfyUI version provides; this is the way to keep a character consistent across stills.

## Prompt hygiene
See [still-world-rules.md](still-world-rules.md) for what to leave out of images destined for parallax.

## Open items
- Re-test the claude.ai connector after the last disconnect.
- Render the three still-world test images and judge them in DepthFlow.
- Export the final workflow JSON into `tools/comfyui/workflows/`.
