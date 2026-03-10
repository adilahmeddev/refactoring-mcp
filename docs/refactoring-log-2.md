# Refactoring Log 2: `src/index.ts` — Extract Handlers & Split Phase

## Code Smells Identified

| Smell | Description |
|-------|-------------|
| **Long Function** | `index.ts` was 159 lines containing both MCP tool registration configuration *and* all handler logic inline in anonymous callbacks. |
| **Shotgun Surgery** | Adding or modifying a tool required understanding registration config, catalog API, and formatting API all at once in a single file. Handler behavior couldn't be changed independently of registration. |

---

## Refactorings Applied

### 1. Extract Function

**Source**: Martin Fowler's Refactoring Catalog — *A First Set of Refactorings*

> *"I look at a fragment of code, understand what it is doing, then extract it into its own function named after its purpose."*

**Smell addressed**: Long Function

**Reason**: Each `registerTool` call contained an anonymous `async` callback with inline business logic — catalog lookups, error handling, formatting composition. These callbacks had no names to describe their intent. Extracting them into named functions (`handleListCategories`, `handleListRefactorings`, `handleGetRefactoring`, `handleListSmells`, `handleSuggestRefactorings`, `handleSearchRefactorings`) makes each handler independently readable and testable.

**Before** (`get_refactoring` handler — inline anonymous callback):
```typescript
server.registerTool(
  "get_refactoring",
  { /* ... config ... */ },
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
```

**After** (named function in `handlers.ts`, delegation in `index.ts`):
```typescript
// src/handlers.ts
export function handleGetRefactoring({ name }: { name: string }) {
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
  return textResponse(
    formatRefactoringDetail(result.refactoring, result.category)
  );
}

// src/index.ts
server.registerTool(
  "get_refactoring",
  { /* ... config ... */ },
  async ({ name }) => handleGetRefactoring({ name })
);
```

---

### 2. Split Phase

**Source**: Martin Fowler's Refactoring Catalog — *A First Set of Refactorings*

> *"When I run into code that's dealing with two different things, I look for a way to split it into separate modules. I endeavor to make this split because, if I need to make a change, I can deal with each topic separately and not have to hold both in my head together."*

**Smell addressed**: Shotgun Surgery

**Reason**: `index.ts` was dealing with two distinct concerns: (1) MCP server configuration and tool registration (schemas, titles, descriptions), and (2) the business logic of handling each tool's request (catalog lookups, error paths, formatting). These are independent — you can change how a tool behaves without changing how it's registered, and vice versa. Splitting them into `index.ts` (registration/configuration phase) and `handlers.ts` (execution phase) gives each module a single reason to change.

**Before** (`index.ts` imports — needed both catalog and formatting APIs):
```typescript
import {
  getAllCategories, getCategoryByName, getRefactoringByName,
  getAllSmells, getRefactoringsForSmells, searchRefactorings, getAllRefactorings,
} from "./catalog.js";
import {
  textResponse, formatCategories, formatRefactoringList,
  formatCategoryRefactorings, formatRefactoringDetail, formatSearchSuggestions,
  formatSmells, formatSmellSuggestions, formatSearchResults,
} from "./formatters.js";
```

**After** (`index.ts` imports — only needs handler functions):
```typescript
import {
  handleListCategories, handleListRefactorings, handleGetRefactoring,
  handleListSmells, handleSuggestRefactorings, handleSearchRefactorings,
} from "./handlers.js";
```

---

## Summary of Impact

| Metric | Before | After |
|--------|--------|-------|
| `index.ts` lines | 159 | 98 |
| `handlers.ts` lines | — (new) | 67 |
| Imports in `index.ts` | 17 (catalog + formatters) | 6 (handlers only) |
| Concerns in `index.ts` | 2 (registration + logic) | 1 (registration only) |
| Handler testability | Requires MCP server mock | Plain function calls |

## Files Changed

| File | Change |
|------|--------|
| `src/index.ts` | Replaced inline handler callbacks with delegations to `handlers.ts` |
| `src/handlers.ts` | **New** — 6 named handler functions extracted from `index.ts` |
