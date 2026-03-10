import * as z from "zod/v4";
import {
  handleGetRefactoring,
  handleListCategories,
  handleListRefactorings,
  handleListSmells,
  handleSearchRefactorings,
  handleSuggestRefactorings,
} from "./handlers.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

function createServer(): McpServer {
  return new McpServer({
    name: "refactoring",
    version: "1.0.0",
  });
}

function registerTools(server: McpServer): void {
  server.registerTool(
    "list_categories",
    {
      description:
        "List all refactoring categories from Martin Fowler's catalog with their descriptions and refactoring names.",
      title: "List Refactoring Categories",
    },
    handleListCategories,
  );

  server.registerTool(
    "list_refactorings",
    {
      description:
        "List refactorings, optionally filtered by category name. Returns name and brief description for each.",
      inputSchema: z.object({
        category: z
          .optional(z.string())
          .describe(
            "Category name to filter by (e.g. 'Encapsulation', 'Moving Features'). Omit to list all.",
          ),
      }),
      title: "List Refactorings",
    },
    handleListRefactorings,
  );

  server.registerTool(
    "get_refactoring",
    {
      description:
        "Get full details for a specific refactoring by name, including its description, motivation, category, and related code smells.",
      inputSchema: z.object({
        name: z
          .string()
          .describe(
            "Name of the refactoring (e.g. 'Extract Function', 'Replace Conditional with Polymorphism')",
          ),
      }),
      title: "Get Refactoring Details",
    },
    handleGetRefactoring,
  );

  server.registerTool(
    "list_smells",
    {
      description:
        "List all code smells from Martin Fowler's catalog with descriptions and suggested refactorings for each.",
      title: "List Code Smells",
    },
    handleListSmells,
  );

  server.registerTool(
    "suggest_refactorings",
    {
      description:
        "Given a list of detected code smells, return the recommended refactorings for each smell with full details. Use this after identifying smells in code to get actionable refactoring suggestions.",
      inputSchema: z.object({
        smells: z
          .array(z.string())
          .describe(
            "List of code smell names detected in the code (e.g. ['Long Function', 'Feature Envy', 'Data Clumps'])",
          ),
      }),
      title: "Suggest Refactorings for Smells",
    },
    handleSuggestRefactorings,
  );

  server.registerTool(
    "search_refactorings",
    {
      description:
        "Search the refactoring catalog by keyword. Matches against refactoring names, descriptions, and motivations.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("Search query (e.g. 'polymorphism', 'extract', 'parameter', 'delegate')"),
      }),
      title: "Search Refactorings",
    },
    handleSearchRefactorings,
  );
}

const server = createServer();
registerTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Refactoring MCP Server running on stdio");
