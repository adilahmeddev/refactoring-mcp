import {
  type ToolResponse,
  formatCategories,
  formatCategoryRefactorings,
  formatRefactoringDetail,
  formatRefactoringList,
  formatSearchResults,
  formatSearchSuggestions,
  formatSmellSuggestions,
  formatSmells,
  textResponse,
} from "./formatters.js";
import {
  getAllCategories,
  getAllRefactorings,
  getAllSmells,
  getCategoryByName,
  getRefactoringByName,
  getRefactoringsForSmells,
  searchRefactorings,
} from "./catalog.js";

export function handleListCategories(): ToolResponse {
  return textResponse(formatCategories(getAllCategories()));
}

export function handleListRefactorings({ category }: { category?: string }): ToolResponse {
  if (category) {
    const cat = getCategoryByName(category);
    if (!cat) {
      return textResponse(
        `Category "${category}" not found. Use list_categories to see available categories.`,
      );
    }
    return textResponse(formatCategoryRefactorings(cat));
  }
  return textResponse(formatRefactoringList(getAllRefactorings()));
}

export function handleGetRefactoring({ name }: { name: string }): ToolResponse {
  const result = getRefactoringByName(name);
  if (!result) {
    const matches = searchRefactorings(name);
    if (matches.length > 0) {
      return textResponse(
        `Refactoring "${name}" not found. Did you mean:\n${formatSearchSuggestions(matches)}`,
      );
    }
    return textResponse(
      `Refactoring "${name}" not found. Use list_refactorings to see available refactorings.`,
    );
  }
  return textResponse(formatRefactoringDetail(result.refactoring, result.category));
}

export function handleListSmells(): ToolResponse {
  return textResponse(formatSmells(getAllSmells()));
}

export function handleSuggestRefactorings({ smells }: { smells: string[] }): ToolResponse {
  return textResponse(formatSmellSuggestions(getRefactoringsForSmells(smells)));
}

export function handleSearchRefactorings({ query }: { query: string }): ToolResponse {
  const results = searchRefactorings(query);
  if (results.length === 0) {
    return textResponse(`No refactorings found matching "${query}".`);
  }
  return textResponse(
    `Found ${results.length} refactoring(s) matching "${query}":\n\n${formatSearchResults(results)}`,
  );
}
