# Claude Code setup (Mac)

## Install and update (Homebrew)
```bash
brew upgrade claude-code     # keep it current; auto-update is managed by the package manager
claude doctor                # check installation and auth
claude auth login            # sign in if doctor says you are not signed in
```
A Homebrew install reports "auto-updates managed by package manager" — that is expected.

## Remote control
You can drive a Claude Code session on the Mac from the Claude Desktop app (same machine) or another device:
- Start with `claude --rc`, or run `/remote-control` inside a session.
- Sessions keep their working directory, tools and MCP servers, so ComfyUI access works the same way.

## MCP servers used
- ComfyUI MCP (FLUX generation) — see [comfyui-flux.md](comfyui-flux.md)
- Blender MCP (later) — see [blender-3d.md](blender-3d.md)

## Cloud chat vs Claude Code
| Surface | Strength |
|---|---|
| Claude Code on the Mac | Local files, ComfyUI, Blender, renders, git |
| claude.ai chat (iPad/web) | Writing, quick prototypes, artifacts; reaches ComfyUI only through the tunnel |

Decisions made in one surface must be written into the repo so the other sees them.

## Housekeeping
- `git lfs install` once per machine (binaries are tracked in LFS).
- Secrets go in `.env`; never in docs.
- A shallow single-branch clone may lack a remote-tracking ref for a new branch; fix with `git config --add remote.origin.fetch '+refs/heads/BRANCH:refs/remotes/origin/BRANCH'` then `git fetch`.
