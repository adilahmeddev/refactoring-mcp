import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import {
  getAllCategories,
  getCategoryByName,
  getRefactoringByName,
  getAllSmells,
  getRefactoringsForSmells,
  searchRefactorings,
  getAllRefactorings,
} from "./catalog.js";
import {
  textResponse,
  formatCategories,
  formatRefactoringList,
  formatCategoryRefactorings,
  formatRefactoringDetail,
  formatSearchSuggestions,
  formatSmells,
  formatSmellSuggestions,
  formatSearchResults,
} from "./formatters.js";

const server = new McpServer({
  name: "refactoring",
  version: "1.0.0",
});

server.registerTool("list_categories", {
  title: "List Refactoring Categories",
  description:
    "List all refactoring categories from Martin Fowler's catalog with their descriptions and refactoring names.",
}, async () => {
  return textResponse(formatCategories(getAllCategories()));
});

server.registerTool(
  "list_refactorings",
  {
    title: "List Refactorings",
    description:
      "List refactorings, optionally filtered by category name. Returns name and brief description for each.",
    inputSchema: z.object({
      category: z
        .optional(z.string())
        .describe(
          "Category name to filter by (e.g. 'Encapsulation', 'Moving Features'). Omit to list all."
        ),
    }),
  },
  async ({ category }) => {
    if (category) {
      const cat = getCategoryByName(category);
      if (!cat) {
        return textResponse(
          `Category "${category}" not found. Use list_categories to see available categories.`
        );
      }
      return textResponse(formatCategoryRefactorings(cat));
    }
    return textResponse(formatRefactoringList(getAllRefactorings()));
  }
);

server.registerTool(
  "get_refactoring",
  {
    title: "Get Refactoring Details",
    description:
      "Get full details for a specific refactoring by name, including its description, motivation, category, and related code smells.",
    inputSchema: z.object({
      name: z
        .string()
        .describe(
          "Name of the refactoring (e.g. 'Extract Function', 'Replace Conditional with Polymorphism')"
        ),
    }),
  },
  async ({ name }) => {
    const result = getRefactoringByName(name);
    if (!result) {
      const matches = searchRefactorings(name);
      if (matches.length > 0) {
        return textResponse(
          `Refactoring "${name}" not found. Did you mean:\n${formatSearchSuggestions(matches)}`
        );
      }
      return textResponse(
        `Refactoring "${name}" not found. Use list_refactorings to see available refactorings.`
      );
    }
    return textResponse(formatRefactoringDetail(result.refactoring, result.category));
  }
);

server.registerTool("list_smells", {
  title: "List Code Smells",
  description:
    "List all code smells from Martin Fowler's catalog with descriptions and suggested refactorings for each.",
}, async () => {
  return textResponse(formatSmells(getAllSmells()));
});

server.registerTool(
  "suggest_refactorings",
  {
    title: "Suggest Refactorings for Smells",
    description:
      "Given a list of detected code smells, return the recommended refactorings for each smell with full details. Use this after identifying smells in code to get actionable refactoring suggestions.",
    inputSchema: z.object({
      smells: z
        .array(z.string())
        .describe(
          "List of code smell names detected in the code (e.g. ['Long Function', 'Feature Envy', 'Data Clumps'])"
        ),
    }),
  },
  async ({ smells }) => {
    return textResponse(formatSmellSuggestions(getRefactoringsForSmells(smells)));
  }
);

server.registerTool(
  "search_refactorings",
  {
    title: "Search Refactorings",
    description:
      "Search the refactoring catalog by keyword. Matches against refactoring names, descriptions, and motivations.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "Search query (e.g. 'polymorphism', 'extract', 'parameter', 'delegate')"
        ),
    }),
  },
  async ({ query }) => {
    const results = searchRefactorings(query);
    if (results.length === 0) {
      return textResponse(`No refactorings found matching "${query}".`);
    }
    return textResponse(
      `Found ${results.length} refactoring(s) matching "${query}":\n\n${formatSearchResults(results)}`
    );
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Refactoring MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
