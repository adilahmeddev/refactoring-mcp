import catalogData from "../resources/refactoring-catalog.json";

export interface Refactoring {
  name: string;
  description: string;
  motivation: string;
  indicators: string[];
}

export interface Category {
  name: string;
  description: string;
  refactorings: Refactoring[];
}

export interface Smell {
  name: string;
  description: string;
  suggestedRefactorings: string[];
}

export interface Catalog {
  categories: Category[];
  smells: Smell[];
}

const catalog: Catalog = catalogData as Catalog;

export function getAllCategories(): Category[] {
  return catalog.categories;
}

export function getCategoryByName(name: string): Category | undefined {
  return catalog.categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

export function getAllRefactorings(): Refactoring[] {
  return catalog.categories.flatMap((c) => c.refactorings);
}

export function getRefactoringByName(name: string):
  | {
      refactoring: Refactoring;
      category: string;
    }
  | undefined {
  for (const category of catalog.categories) {
    const refactoring = category.refactorings.find(
      (r) => r.name.toLowerCase() === name.toLowerCase(),
    );
    if (refactoring) {
      return { category: category.name, refactoring };
    }
  }
  return undefined;
}

export function getAllSmells(): Smell[] {
  return catalog.smells;
}

export function getSmellByName(name: string): Smell | undefined {
  return catalog.smells.find((s) => s.name.toLowerCase() === name.toLowerCase());
}

export function getRefactoringsForSmells(smellNames: string[]): {
  smell: string;
  refactorings: { name: string; description: string; category: string }[];
}[] {
  return smellNames.map((smellName) => {
    const smell = catalog.smells.find((s) => s.name.toLowerCase() === smellName.toLowerCase());
    if (!smell) {
      return { refactorings: [], smell: smellName };
    }
    const refactorings = smell.suggestedRefactorings.map((refName) => {
      const found = getRefactoringByName(refName);
      return {
        category: found?.category ?? "Unknown",
        description: found?.refactoring.description ?? "Unknown refactoring",
        name: refName,
      };
    });
    return { refactorings, smell: smell.name };
  });
}

export function searchRefactorings(query: string): {
  refactoring: Refactoring;
  category: string;
}[] {
  const lower = query.toLowerCase();
  const results: { refactoring: Refactoring; category: string }[] = [];
  for (const category of catalog.categories) {
    for (const refactoring of category.refactorings) {
      if (
        refactoring.name.toLowerCase().includes(lower) ||
        refactoring.description.toLowerCase().includes(lower) ||
        refactoring.motivation.toLowerCase().includes(lower)
      ) {
        results.push({ category: category.name, refactoring });
      }
    }
  }
  return results;
}
