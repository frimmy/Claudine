# Claude Code Clone

## Overview

Claude Code Clone is an MVP implementation of an agentic coding assistant with sandboxed execution. It provides an AI-powered coding interface where Claude can autonomously use tools to complete programming tasks including file operations (read, write, edit), search capabilities (glob patterns and grep), and bash command execution. All operations are confined to a sandbox directory for security.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Runtime**: Bun (TypeScript runtime) - chosen for fast startup and native TypeScript support
- **Web Server**: Express.js serving static files and handling HTTP requests
- **Real-time Communication**: WebSocket (ws library) for bidirectional communication between client and server
- **AI Integration**: Anthropic SDK for Claude API interactions with tool-use capabilities

### Frontend Architecture
- **Single Page Application**: Vanilla HTML/CSS/JavaScript served from `/public` directory
- **Styling**: Terminal-inspired dark theme with CSS custom properties (CSS variables)
- **Fonts**: JetBrains Mono (code) and Instrument Sans (UI) via Google Fonts
- **Communication**: WebSocket client for real-time updates from the agentic loop

### Agentic Tool System
The core feature is an agentic loop where Claude can use these tools:
- `read` - Read file contents from sandbox
- `write` - Create or overwrite files in sandbox
- `edit` - Find and replace within files
- `glob` - Find files by pattern matching
- `grep` - Search file contents
- `bash` - Execute shell commands

### Security Model
- **Sandbox Directory**: All file operations are confined to a `sandbox/` directory
- **Path Resolution**: File paths are resolved relative to sandbox root
- **Environment Variable**: `SANDBOX_DIR` can override default sandbox location

### Project Structure
```
/
├── server.ts          # Main server with Express, WebSocket, and tool implementations
├── public/
│   └── index.html     # Frontend SPA with embedded CSS/JS
├── sandbox/           # Sandboxed directory for file operations
│   └── hello.py       # Sample file created on startup
├── package.json       # Dependencies and scripts
└── tsconfig.json      # TypeScript configuration
```

## External Dependencies

### AI Services
- **Anthropic Claude API**: Primary AI backend for the agentic coding assistant
  - Requires `ANTHROPIC_API_KEY` environment variable
  - Uses tool-use/function-calling capabilities

### NPM Packages
- `@anthropic-ai/sdk` - Official Anthropic SDK for Claude API
- `express` - Web server framework
- `ws` - WebSocket implementation for real-time communication
- `glob` - File pattern matching for the glob tool

### Runtime Requirements
- Bun runtime (or Node.js >= 18.0.0)
- TypeScript (compiled at runtime by Bun)