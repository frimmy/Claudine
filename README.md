# Claude Code Clone

An MVP implementation of Claude Code - an agentic coding assistant with sandboxed execution.

![Screenshot](https://img.shields.io/badge/Status-Ready%20to%20Deploy-brightgreen)

## Features

- 🤖 **Agentic Loop** - Claude autonomously uses tools to complete tasks
- 📁 **File Operations** - read, write, edit files
- 🔍 **Search** - glob patterns and grep for content
- 💻 **Bash Execution** - run commands in sandboxed environment
- 🎨 **Beautiful UI** - terminal-inspired dark theme
- 🔒 **Sandboxed** - all operations confined to sandbox directory

## Tools Available

| Tool | Description |
|------|-------------|
| `read` | Read file contents |
| `write` | Create/overwrite files |
| `edit` | Find and replace in files |
| `glob` | Find files by pattern |
| `grep` | Search file contents |
| `bash` | Execute shell commands |

## Quick Start

### Local Development

```bash
# Clone and install
git clone <your-repo>
cd claude-code-clone
npm install

# Set your API key
export ANTHROPIC_API_KEY=your-key-here

# Run
npm start
```

Open http://localhost:3000

### One-Click Deploy

#### Replit (Easiest)
1. Go to [replit.com](https://replit.com)
2. Click "Create Repl" → Import from GitHub
3. Add secret: `ANTHROPIC_API_KEY`
4. Click Run

#### Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

1. Connect your GitHub repo
2. Add environment variable: `ANTHROPIC_API_KEY`
3. Deploy!

#### Render
1. Go to [render.com](https://render.com)
2. New → Web Service → Connect repo
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy

#### Fly.io
```bash
# Install flyctl, then:
fly launch
fly secrets set ANTHROPIC_API_KEY=your-key
fly deploy
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `PORT` | No | Server port (default: 3000) |
| `SANDBOX_DIR` | No | Custom sandbox directory |

## Architecture

```
┌─────────────────────────────────────────────┐
│           Browser (index.html)              │
│  • Terminal-style chat UI                   │
│  • File explorer sidebar                    │
│  • WebSocket connection                     │
└─────────────────┬───────────────────────────┘
                  │ WebSocket
┌─────────────────▼───────────────────────────┐
│            server.js                        │
│  • Express + WebSocket server               │
│  • Agentic loop with tool calling           │
│  • Tool implementations                     │
│  • Sandbox security                         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           /sandbox directory                │
│  • Isolated file operations                 │
│  • Bash command execution                   │
└─────────────────────────────────────────────┘
```

## Security Notes

- All file operations are confined to the sandbox directory
- Path traversal attacks are blocked
- Bash commands run with a 30-second timeout
- For production, consider additional isolation (Docker, gVisor, etc.)

## Example Prompts

- "Read the hello.py file and explain what it does"
- "Create a new file called fibonacci.py that prints the first 20 fibonacci numbers"
- "Find all Python files and add type hints"
- "Run the tests and fix any failures"
- "Search for TODO comments in all files"

## License

MIT
