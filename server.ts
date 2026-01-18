import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Sandbox directory - all file operations happen here
const SANDBOX_DIR = process.env.SANDBOX_DIR || join(__dirname, "sandbox");
if (!existsSync(SANDBOX_DIR)) {
  mkdirSync(SANDBOX_DIR, { recursive: true });
}

// Create a sample file in sandbox
const sampleFile = join(SANDBOX_DIR, "hello.py");
if (!existsSync(sampleFile)) {
  writeFileSync(
    sampleFile,
    `# Welcome to Claude Code Clone!
# Try asking me to:
# - Read this file
# - Create a new file
# - Run some bash commands
# - Search for patterns

def greet(name):
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet("World"))
`,
  );
}

interface ToolSchema {
  type: string;
  properties: Record<string, any>;
  required: string[];
}

interface ToolDefinition {
  name: string;
  description: string;
  input_schema: ToolSchema;
}

// Tool definitions for Claude
const tools: ToolDefinition[] = [
  {
    name: "read",
    description:
      "Read the contents of a file. Returns the file content as a string.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The path to the file to read (relative to sandbox)",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write",
    description:
      "Write content to a file. Creates the file if it doesn't exist, overwrites if it does.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The path to the file to write (relative to sandbox)",
        },
        content: {
          type: "string",
          description: "The content to write to the file",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "edit",
    description:
      "Edit a file by replacing a specific string with another. Use for surgical edits.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The path to the file to edit (relative to sandbox)",
        },
        old_string: {
          type: "string",
          description: "The exact string to find and replace",
        },
        new_string: {
          type: "string",
          description: "The string to replace it with",
        },
      },
      required: ["path", "old_string", "new_string"],
    },
  },
  {
    name: "glob",
    description:
      "Find files matching a glob pattern. Returns a list of matching file paths.",
    input_schema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "The glob pattern to match (e.g., '**/*.js', '*.py')",
        },
      },
      required: ["pattern"],
    },
  },
  {
    name: "grep",
    description:
      "Search for a pattern in files. Returns matching lines with file paths and line numbers.",
    input_schema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "The regex pattern to search for",
        },
        path: {
          type: "string",
          description:
            "Optional: specific file or directory to search in (defaults to all files)",
        },
      },
      required: ["pattern"],
    },
  },
  {
    name: "bash",
    description:
      "Execute a bash command. Returns stdout and stderr. Use for running scripts, installing packages, etc.",
    input_schema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The bash command to execute",
        },
      },
      required: ["command"],
    },
  },
];

// Tool implementations
function resolvePath(relativePath: string) {
  const resolved = resolve(SANDBOX_DIR, relativePath);
  // Security: ensure path stays within sandbox
  if (!resolved.startsWith(SANDBOX_DIR)) {
    throw new Error("Path escapes sandbox directory");
  }
  return resolved;
}

function executeTool(name: string, input: any): any {
  try {
    switch (name) {
      case "read": {
        const fullPath = resolvePath(input.path);
        if (!existsSync(fullPath)) {
          return { error: `File not found: ${input.path}` };
        }
        const content = readFileSync(fullPath, "utf-8");
        return { content, path: input.path };
      }

      case "write": {
        const fullPath = resolvePath(input.path);
        const dir = dirname(fullPath);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        writeFileSync(fullPath, input.content);
        return { success: true, path: input.path, bytes: input.content.length };
      }

      case "edit": {
        const fullPath = resolvePath(input.path);
        if (!existsSync(fullPath)) {
          return { error: `File not found: ${input.path}` };
        }
        let content = readFileSync(fullPath, "utf-8");
        if (!content.includes(input.old_string)) {
          return { error: `String not found in file: "${input.old_string}"` };
        }
        content = content.replace(input.old_string, input.new_string);
        writeFileSync(fullPath, content);
        return { success: true, path: input.path };
      }

      case "glob": {
        const matches = glob.sync(input.pattern, {
          cwd: SANDBOX_DIR,
          nodir: true,
        });
        return { matches, count: matches.length };
      }

      case "grep": {
        const results: any[] = [];
        const searchPath = input.path ? resolvePath(input.path) : SANDBOX_DIR;
        const pattern = new RegExp(input.pattern, "gi");

        function searchFile(filePath: string) {
          try {
            const content = readFileSync(filePath, "utf-8");
            const lines = content.split("\n");
            lines.forEach((line, idx) => {
              if (pattern.test(line)) {
                const relativePath = filePath
                  .replace(SANDBOX_DIR + "/", "")
                  .replace(SANDBOX_DIR, "");
                results.push({
                  file: relativePath || filePath,
                  line: idx + 1,
                  content: line.trim(),
                });
              }
            });
          } catch {
            // Skip unreadable files
          }
        }

        if (existsSync(searchPath)) {
          const files = glob.sync("**/*", { cwd: SANDBOX_DIR, nodir: true });
          files.forEach((f) => searchFile(join(SANDBOX_DIR, f)));
        }

        return { results, count: results.length };
      }

      case "bash": {
        try {
          const result = execSync(input.command, {
            cwd: SANDBOX_DIR,
            encoding: "utf-8",
            timeout: 30000,
            maxBuffer: 1024 * 1024,
          });
          return { stdout: result, exitCode: 0 };
        } catch (err: any) {
          return {
            stdout: err.stdout || "",
            stderr: err.stderr || err.message,
            exitCode: err.status || 1,
          };
        }
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}

// Agentic loop
async function runAgentLoop(userMessage: string, ws: WebSocket) {
  const client = new Anthropic();

  const systemPrompt = `You are Claude Code, an agentic coding assistant running in a sandboxed environment.
You have access to tools that let you read, write, and edit files, search with glob and grep, and execute bash commands.

IMPORTANT GUIDELINES:
1. Be proactive - use tools to explore and understand the codebase
2. Show your work - explain what you're doing and why
3. Be thorough - verify your changes work by reading files or running tests
4. All file paths are relative to the sandbox directory
5. For multi-step tasks, plan first then execute step by step

Current working directory contains the sandbox with user files.`;

  const messages: any[] = [{ role: "user", content: userMessage }];

  // Send initial status
  ws.send(JSON.stringify({ type: "status", content: "Thinking..." }));

  let iterations = 0;
  const maxIterations = 20;

  while (iterations < maxIterations) {
    iterations++;

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      system: systemPrompt,
      tools: tools as any,
      messages,
    });

    // Process the response
    let hasToolUse = false;
    const assistantContent: any[] = [];
    const toolResults: any[] = [];

    for (const block of response.content) {
      if (block.type === "text") {
        ws.send(JSON.stringify({ type: "text", content: block.text }));
        assistantContent.push(block);
      } else if (block.type === "tool_use") {
        hasToolUse = true;
        assistantContent.push(block);

        // Send tool invocation to client
        ws.send(
          JSON.stringify({
            type: "tool_call",
            tool: block.name,
            input: block.input,
          }),
        );

        // Execute tool
        const result = executeTool(block.name, block.input);

        // Send tool result to client
        ws.send(
          JSON.stringify({
            type: "tool_result",
            tool: block.name,
            result,
          }),
        );

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
    }

    // Add assistant message to history
    messages.push({ role: "assistant", content: assistantContent });

    // If there were tool uses, add results and continue
    if (hasToolUse) {
      messages.push({ role: "user", content: toolResults });
      ws.send(JSON.stringify({ type: "status", content: "Continuing..." }));
    }

    // Check if we should stop
    if (response.stop_reason === "end_turn" && !hasToolUse) {
      break;
    }
  }

  ws.send(JSON.stringify({ type: "done" }));
}

// WebSocket connection handler
wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === "chat") {
        await runAgentLoop(message.content, ws);
      }
    } catch (err: any) {
      ws.send(JSON.stringify({ type: "error", content: err.message }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Serve static files and the main page
app.use(express.static(join(__dirname, "public")));

app.get("/", (_req: Request, res: Response) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

// API endpoint to list sandbox files
app.get("/api/files", (_req: Request, res: Response) => {
  const files = glob.sync("**/*", { cwd: SANDBOX_DIR, nodir: true });
  res.json({ files });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Claude Code Clone running at http://localhost:${PORT}`);
  console.log(`📁 Sandbox directory: ${SANDBOX_DIR}`);
});
