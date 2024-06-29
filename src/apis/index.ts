import { Book } from "../types";
import { getNotionClient } from "./notionClient";

export interface BookResponse {
  books: Book[];
  hasMore: boolean;
}

export async function getBooks(config: { start?: string; amount?: number }) {
  console.log("getBooks");
  try {
    const notion = getNotionClient();
    const response = await notion.databases.query({
      database_id: process.env.NOTION_BOOKSHLEF_ID || "",
      page_size: config.amount || 10,
      start_cursor: config.start ? config.start : undefined,
    });
    return Promise.resolve(response);
  } catch (error) {
    return Promise.reject(error);
  }
}
