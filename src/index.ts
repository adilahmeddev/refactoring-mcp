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

const server = new McpServer({
  name: "refactoring",
  version: "1.0.0",
});

server.registerTool("list_categories", {
  title: "List Refactoring Categories",
  description:
    "List all refactoring categories from Martin Fowler's catalog with their descriptions and refactoring names.",
}, async () => {
  const categories = getAllCategories();
  const text = categories
    .map(
      (c) =>
        `## ${c.name}\n${c.description}\n\nRefactorings: ${c.refactorings.map((r) => r.name).join(", ")}`
    )
    .join("\n\n---\n\n");
  return { content: [{ type: "text" as const, text }] };
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
        return {
          content: [
            {
              type: "text" as const,
              text: `Category "${category}" not found. Use list_categories to see available categories.`,
            },
          ],
        };
      }
      const text = cat.refactorings
        .map((r) => `**${r.name}**: ${r.description}`)
        .join("\n\n");
      return {
        content: [{ type: "text" as const, text: `## ${cat.name}\n\n${text}` }],
      };
    }
    const all = getAllRefactorings();
    const text = all.map((r) => `- **${r.name}**: ${r.description}`).join("\n");
    return { content: [{ type: "text" as const, text }] };
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
        const suggestions = matches
          .slice(0, 5)
          .map((m) => `- ${m.refactoring.name} (${m.category})`)
          .join("\n");
        return {
          content: [
            {
              type: "text" as const,
              text: `Refactoring "${name}" not found. Did you mean:\n${suggestions}`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: `Refactoring "${name}" not found. Use list_refactorings to see available refactorings.`,
          },
        ],
      };
    }
    const { refactoring, category } = result;
    const text = [
      `# ${refactoring.name}`,
      `**Category**: ${category}`,
      "",
      `## Description`,
      refactoring.description,
      "",
      `## Motivation`,
      refactoring.motivation,
      "",
      `## Indicators (Code Smells)`,
      refactoring.indicators.length > 0
        ? refactoring.indicators.map((i) => `- ${i}`).join("\n")
        : "No specific smell indicators listed.",
    ].join("\n");
    return { content: [{ type: "text" as const, text }] };
  }
);

server.registerTool("list_smells", {
  title: "List Code Smells",
  description:
    "List all code smells from Martin Fowler's catalog with descriptions and suggested refactorings for each.",
}, async () => {
  const smells = getAllSmells();
  const text = smells
    .map(
      (s) =>
        `### ${s.name}\n${s.description}\n**Suggested refactorings**: ${s.suggestedRefactorings.join(", ")}`
    )
    .join("\n\n");
  return { content: [{ type: "text" as const, text }] };
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
    const results = getRefactoringsForSmells(smells);
    const text = results
      .map((r) => {
        if (r.refactorings.length === 0) {
          return `### ${r.smell}\nNo matching smell found in catalog. Available smells: use list_smells to see all.`;
        }
        const refList = r.refactorings
          .map((ref) => `- **${ref.name}** (${ref.category}): ${ref.description}`)
          .join("\n");
        return `### ${r.smell}\n${refList}`;
      })
      .join("\n\n---\n\n");
    return { content: [{ type: "text" as const, text }] };
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
      return {
        content: [
          {
            type: "text" as const,
            text: `No refactorings found matching "${query}".`,
          },
        ],
      };
    }
    const text = results
      .map(
        (r) =>
          `- **${r.refactoring.name}** (${r.category}): ${r.refactoring.description}`
      )
      .join("\n");
    return {
      content: [
        {
          type: "text" as const,
          text: `Found ${results.length} refactoring(s) matching "${query}":\n\n${text}`,
        },
      ],
    };
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
