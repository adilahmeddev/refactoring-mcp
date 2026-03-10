# Refactoring Log 3: `src/index.ts`

## Code Smells Identified

### 1. Long Function (module-level script)

The entire file was a single module-level script that mixed three distinct responsibilities:

- Server creation
- Tool registration (6 tools)
- Server startup and transport connection

There were no function boundaries separating these concerns, making the file harder to navigate and impossible to test individual phases in isolation.

### 2. Duplicated Code (structural)

The module-level `server` variable was created at the top and used implicitly by all 6 `registerTool` calls and by `main()`. This implicit shared state is a mild form of coupling — the registration block and the startup block both depended on the same module-level mutable binding.

---

## Refactorings Applied

### 1. Extract Function — `createServer()`

**Source**: Martin Fowler's _Refactoring_, "A First Set of Refactorings"

**Reason**: The server instantiation (`new McpServer(...)`) was a standalone concern mixed into the module-level script. Extracting it into `createServer()` gives it a name, makes the configuration explicit, and allows `main()` to own the server's lifecycle.

**Before**:

```typescript
const server = new McpServer({
  name: "refactoring",
  version: "1.0.0",
});

// ... 80 lines of tool registration using module-level `server` ...

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Refactoring MCP Server running on stdio");
}
```

**After**:

```typescript
function createServer(): McpServer {
  return new McpServer({
    name: "refactoring",
    version: "1.0.0",
  });
}

async function main() {
  const server = createServer();
  registerTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Refactoring MCP Server running on stdio");
}
```

### 2. Extract Function — `registerTools(server)`

**Source**: Martin Fowler's _Refactoring_, "A First Set of Refactorings"

**Reason**: The 6 `registerTool` calls were the bulk of the file (~80 lines) and represented a single logical phase: "configure which tools the server exposes." Extracting them into `registerTools(server)` achieves several things:

- **Separation of concerns**: Tool definitions are isolated from server lifecycle.
- **Eliminates module-level mutable state**: The `server` variable moves from module scope into `main()`, passed explicitly to `registerTools`.
- **Readability**: `main()` now reads as a clear 3-step pipeline: create → configure → start.

**Before** (module-level script):

```typescript
const server = new McpServer({ ... });

server.registerTool("list_categories", { ... }, async () => handleListCategories());
server.registerTool("list_refactorings", { ... }, async ({ category }) => handleListRefactorings({ category }));
server.registerTool("get_refactoring", { ... }, async ({ name }) => handleGetRefactoring({ name }));
server.registerTool("list_smells", { ... }, async () => handleListSmells());
server.registerTool("suggest_refactorings", { ... }, async ({ smells }) => handleSuggestRefactorings({ smells }));
server.registerTool("search_refactorings", { ... }, async ({ query }) => handleSearchRefactorings({ query }));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Refactoring MCP Server running on stdio");
}
```

**After**:

```typescript
function registerTools(server: McpServer): void {
  server.registerTool("list_categories", { ... }, handleListCategories);
  server.registerTool("list_refactorings", { ... }, handleListRefactorings);
  // ... remaining tools ...
}

async function main() {
  const server = createServer();
  registerTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Refactoring MCP Server running on stdio");
}
```

### 3. Remove Middle Man — inline handler callbacks

**Source**: Martin Fowler's _Refactoring_, "Moving Features"

**Reason**: Every tool callback was a thin wrapper that destructured args and re-wrapped them into the same shape:

```typescript
async ({ category }) => handleListRefactorings({ category })
```

This is a **Middle Man** — a function whose only job is to delegate to another function with the exact same arguments. The SDK passes the parsed schema output (e.g., `{ category?: string }`) directly as the first argument, which already matches the handler signatures. The extra `extra` parameter passed by the SDK is simply ignored by the handlers.

**Before**:

```typescript
server.registerTool("list_categories", { ... }, async () => handleListCategories());
server.registerTool("list_refactorings", { ... }, async ({ category }) => handleListRefactorings({ category }));
server.registerTool("get_refactoring", { ... }, async ({ name }) => handleGetRefactoring({ name }));
server.registerTool("list_smells", { ... }, async () => handleListSmells());
server.registerTool("suggest_refactorings", { ... }, async ({ smells }) => handleSuggestRefactorings({ smells }));
server.registerTool("search_refactorings", { ... }, async ({ query }) => handleSearchRefactorings({ query }));
```

**After**:

```typescript
server.registerTool("list_categories", { ... }, handleListCategories);
server.registerTool("list_refactorings", { ... }, handleListRefactorings);
server.registerTool("get_refactoring", { ... }, handleGetRefactoring);
server.registerTool("list_smells", { ... }, handleListSmells);
server.registerTool("suggest_refactorings", { ... }, handleSuggestRefactorings);
server.registerTool("search_refactorings", { ... }, handleSearchRefactorings);
```

---

## Summary of Changes

| Aspect                     | Before                                        | After                                                |
| -------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| Module-level mutable state | `const server` at module scope                | `server` local to `main()`                           |
| Function boundaries        | Only `main()`                                 | `createServer()`, `registerTools()`, `main()`        |
| `main()` readability       | Implicit — relied on prior module-level setup | Explicit 3-step pipeline: create → configure → start |
| Tool registration          | Mixed into module-level script                | Encapsulated in `registerTools(server)`              |
| Testability                | Cannot test phases independently              | Each function can be called/tested in isolation      |
| Handler callbacks          | Wrapper lambdas that destructure and re-wrap  | Direct function references                           |

## Refactorings Considered but Not Applied

**Data-driven tool registration loop**: I considered extracting tool definitions into a data array and iterating over it to call `registerTool`. However, the MCP SDK's `registerTool` method is heavily generic — each tool has different input schema types that are inferred at the call site. A data-driven approach would require complex type gymnastics (`any` casts or discriminated unions) that would reduce type safety without meaningful benefit for 6 tools. The current explicit registration is both type-safe and readable.
