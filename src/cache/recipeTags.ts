import { type RecipeTagsResponse, type RecipeTag } from "../types";
import { getRecipeTags } from "../apis";

const isProduction = process.env.NODE_ENV === "production";

export interface RecipeTagsCache {
  recipeTags: RecipeTag[];
  updatedAt: Date;
}

const CACHE_MAX_AGE = isProduction ? 1000 * 60 * 60 : 1000 * 60 * 5;

let cache: RecipeTagsCache | null = null;

const formatRecipeTagsResponse = (
  response: RecipeTagsResponse
): RecipeTag[] => {
  const recipes = response.map((recipe) => {
    return {
      id: recipe.id,
      title: recipe.properties.title?.title[0].plain_text,
      relatedRecipes: recipe.properties.related_recipes.relation || [],
    };
  });
  return recipes;
};

const getAllRecipeTags = async (): Promise<RecipeTag[]> => {
  try {
    let count = 0;
    let recipeTags: RecipeTag[] = [];
    let hasMore = true;
    let nextCursor = "";
    do {
      count++;
      const { results, has_more, next_cursor } = await getRecipeTags({
        amount: 10,
        start: nextCursor,
      });
      const recipeTagsResponse = results as unknown as RecipeTagsResponse;
      const newRecipeTags = formatRecipeTagsResponse(recipeTagsResponse);
      recipeTags = [...recipeTags, ...newRecipeTags];
      hasMore = has_more;
      nextCursor = next_cursor || "";
    } while (hasMore && count < 2);
    return Promise.resolve(recipeTags);
  } catch (error) {
    return Promise.reject(error);
  }
};

export async function getRecipeTagsFromCache(): Promise<RecipeTag[]> {
  if (cache) {
    if (cache.updatedAt.getTime() + CACHE_MAX_AGE < new Date().getTime()) {
      const recipeTags = await getAllRecipeTags();
      setRecipeTagsToCache(recipeTags);
      return Promise.resolve(recipeTags);
    }
    return Promise.resolve(cache.recipeTags);
  } else {
    const recipeTags = await getAllRecipeTags();
    setRecipeTagsToCache(recipeTags);
    return Promise.resolve(recipeTags);
  }
}

export function setRecipeTagsToCache(recipeTags: RecipeTag[]): void {
  cache = {
    recipeTags: recipeTags,
    updatedAt: new Date(),
  };
}

export function getRecipeTagsCacheUpdatedAt(): Date | null {
  if (!cache) {
    return null;
  }
  return cache.updatedAt;
}

export function clearRecipeTagsCache(): void {
  cache = null;
}
