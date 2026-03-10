# Refactoring Log: `src/index.ts`

## Code Smells Identified

| Smell | Description |
|-------|-------------|
| **Duplicated Code** | The pattern `{ content: [{ type: "text" as const, text }] }` was repeated 10 times across all tool handlers. |
| **Long Function** | Each tool handler mixed two concerns — data retrieval and markdown formatting — making the handlers long and hard to scan. |
| **Feature Envy** | Formatting logic in `index.ts` operated entirely on data structures from `catalog.ts`, suggesting it belonged in its own module closer to those types. |

## Refactorings Applied

### 1. Extract Function — `textResponse`

**Smell addressed**: Duplicated Code

**Reason**: Every tool handler constructed the same `{ content: [{ type: "text" as const, text }] }` response wrapper. Extracting this into a single `textResponse(text)` helper eliminates the duplication and makes the return type consistent in one place.

**Before**:
```typescript
// Repeated in every handler (10 occurrences):
return { content: [{ type: "text" as const, text }] };

// Some handlers had inline variants:
return {
  content: [
    {
      type: "text" as const,
      text: `Category "${category}" not found. Use list_categories to see available categories.`,
    },
  ],
};
```

**After**:
```typescript
// Single helper in formatters.ts:
export function textResponse(text: string): ToolResponse {
  return { content: [{ type: "text", text }] };
}

// All handlers now use:
return textResponse(formatCategories(getAllCategories()));
return textResponse(`Category "${category}" not found. Use list_categories to see available categories.`);
```

---

### 2. Extract Function — Formatting functions

**Smell addressed**: Long Function, Feature Envy

**Reason**: Each tool handler contained inline `.map().join()` chains that formatted domain objects into markdown. These formatting concerns were extracted into named functions (`formatCategories`, `formatRefactoringList`, `formatCategoryRefactorings`, `formatRefactoringDetail`, `formatSearchSuggestions`, `formatSmells`, `formatSmellSuggestions`, `formatSearchResults`), making each handler a concise composition of "get data → format → respond".

**Before** (`list_categories` handler):
```typescript
async () => {
  const categories = getAllCategories();
  const text = categories
    .map(
      (c) =>
        `## ${c.name}\n${c.description}\n\nRefactorings: ${c.refactorings.map((r) => r.name).join(", ")}`
    )
    .join("\n\n---\n\n");
  return { content: [{ type: "text" as const, text }] };
}
```

**After**:
```typescript
async () => {
  return textResponse(formatCategories(getAllCategories()));
}
```

**Before** (`get_refactoring` handler, success path):
```typescript
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
```

**After**:
```typescript
return textResponse(formatRefactoringDetail(result.refactoring, result.category));
```

**Before** (`suggest_refactorings` handler):
```typescript
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
```

**After**:
```typescript
async ({ smells }) => {
  return textResponse(formatSmellSuggestions(getRefactoringsForSmells(smells)));
}
```

---

### 3. Extract Module — `src/formatters.ts`

**Smell addressed**: Long Function, Feature Envy

**Reason**: The formatting functions extracted above all operate on types from `catalog.ts` and have no dependency on the MCP server. Moving them to a dedicated `formatters.ts` module separates the concerns of "how to format domain data as markdown" from "how to wire up MCP tool handlers". This makes `index.ts` focused solely on server setup and request routing, while `formatters.ts` owns all presentation logic.

**Files changed**:
- **New**: `src/formatters.ts` — Contains `textResponse` and 8 formatting functions
- **Modified**: `src/index.ts` — Imports from `formatters.ts`, handlers reduced to 1-3 lines each

## Summary of Impact

| Metric | Before | After |
|--------|--------|-------|
| `index.ts` lines | 234 | 144 |
| Inline formatting chains | 6 | 0 |
| Duplicated response wrappers | 10 | 0 |
| Longest handler (lines) | 44 (`get_refactoring`) | 11 (`get_refactoring`) |
| Modules | 2 (`index.ts`, `catalog.ts`) | 3 (`index.ts`, `catalog.ts`, `formatters.ts`) |
