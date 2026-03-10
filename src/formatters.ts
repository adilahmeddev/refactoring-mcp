import type { Category, Refactoring, Smell } from "./catalog.js";

interface TextContent {
  type: "text";
  text: string;
}
export interface ToolResponse {
  [key: string]: unknown;
  content: TextContent[];
}

export function textResponse(text: string): ToolResponse {
  return { content: [{ text, type: "text" }] };
}

export function formatCategories(categories: Category[]): string {
  return categories
    .map(
      (c) =>
        `## ${c.name}\n${c.description}\n\nRefactorings: ${c.refactorings.map((r) => r.name).join(", ")}`,
    )
    .join("\n\n---\n\n");
}

export function formatRefactoringList(refactorings: Refactoring[]): string {
  return refactorings.map((r) => `- **${r.name}**: ${r.description}`).join("\n");
}

export function formatCategoryRefactorings(category: Category): string {
  const text = category.refactorings.map((r) => `**${r.name}**: ${r.description}`).join("\n\n");
  return `## ${category.name}\n\n${text}`;
}

export function formatRefactoringDetail(refactoring: Refactoring, category: string): string {
  return [
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
}

export function formatSearchSuggestions(
  matches: { refactoring: Refactoring; category: string }[],
): string {
  return matches
    .slice(0, 5)
    .map((m) => `- ${m.refactoring.name} (${m.category})`)
    .join("\n");
}

export function formatSmells(smells: Smell[]): string {
  return smells
    .map(
      (s) =>
        `### ${s.name}\n${s.description}\n**Suggested refactorings**: ${s.suggestedRefactorings.join(", ")}`,
    )
    .join("\n\n");
}

export function formatSmellSuggestions(
  results: {
    smell: string;
    refactorings: { name: string; description: string; category: string }[];
  }[],
): string {
  return results
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
}

export function formatSearchResults(
  results: { refactoring: Refactoring; category: string }[],
): string {
  return results
    .map((r) => `- **${r.refactoring.name}** (${r.category}): ${r.refactoring.description}`)
    .join("\n");
}
