# Refactoring MCP

An MCP server exposing Martin Fowler's refactoring catalog as tools for AI agents to use during code refactoring. Includes 61 refactorings across 7 categories and 24 code smells.

## Install as Claude Code Plugin

Requires [bun](https://bun.sh) installed on your system.

```bash
# Add the marketplace
claude plugin marketplace add adilahmeddev/refactoring-mcp

# Install the plugin
claude plugin install refactoring-mcp@refactoring-marketplace
```

Or install from a local clone:

```bash
git clone https://github.com/adilahmeddev/refactoring-mcp.git
cd refactoring-mcp
bun install
claude plugin install /path/to/refactoring-mcp
```

## Tools

| Tool                   | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `list_categories`      | Browse all 7 refactoring categories                 |
| `list_refactorings`    | List refactorings, optionally filtered by category  |
| `get_refactoring`      | Full details for a specific refactoring             |
| `list_smells`          | All 24 code smells with suggested refactorings      |
| `suggest_refactorings` | Given detected smells, get recommended refactorings |
| `search_refactorings`  | Keyword search across the catalog                   |

## Development

```bash
bun install
bun run start       # Run server via bun
bun run build       # Compile standalone binary
bun run typecheck   # Type check
```
