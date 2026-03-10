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

export function handleListCategories() {
  return textResponse(formatCategories(getAllCategories()));
}

export function handleListRefactorings({ category }: { category?: string }) {
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

export function handleListSmells() {
  return textResponse(formatSmells(getAllSmells()));
}

export function handleSuggestRefactorings({ smells }: { smells: string[] }) {
  return textResponse(
    formatSmellSuggestions(getRefactoringsForSmells(smells))
  );
}

export function handleSearchRefactorings({ query }: { query: string }) {
  const results = searchRefactorings(query);
  if (results.length === 0) {
    return textResponse(`No refactorings found matching "${query}".`);
  }
  return textResponse(
    `Found ${results.length} refactoring(s) matching "${query}":\n\n${formatSearchResults(results)}`
  );
}
