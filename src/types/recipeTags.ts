export interface RecipeTag {
  id: string;
  title: string;
}

export interface RecipeTagResponseProperties {
  title: {
    id: string;
    title: [
      {
        plain_text: string;
      }
    ];
  };
}

export interface RecipeTagResponse {
  id: string;
  properties: RecipeTagResponseProperties;
}

export type RecipeTagsResponse = RecipeTagResponse[];