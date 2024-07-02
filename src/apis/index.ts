import { Book } from "../types";
import { getNotionClient } from "./notionClient";

export interface BookResponse {
  books: Book[];
  hasMore: boolean;
}

export async function getBooks(config: { start?: string; amount?: number }) {
  try {
    const notion = getNotionClient();
    const response = await notion.databases.query({
      database_id: process.env.NOTION_BOOKSHLEF_ID || "",
      page_size: config.amount || 10,
      start_cursor: config.start ? config.start : undefined,
      sorts: [
        {
          property: "updated_at",
          direction: "descending",
        },
      ],
    });
    return Promise.resolve(response);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function getBook(id: string) {
  try {
    const notion = getNotionClient();
    const response = await notion.pages.retrieve({
      page_id: id,
    });
    return Promise.resolve(response);
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function getRecipeTags(config: {
  start?: string;
  amount?: number;
}) {
  try {
    const notion = getNotionClient();
    const response = await notion.databases.query({
      database_id: process.env.NOTION_RECIPE_TAG_ID || "",
      page_size: config.amount || 10,
      start_cursor: config.start ? config.start : undefined,
      // sorts: [
      //   {
      //     property: "updated_at",
      //     direction: "descending",
      //   },
      // ],
    });
    return Promise.resolve(response);
  } catch (error) {
    return Promise.reject(error);
  }
}
