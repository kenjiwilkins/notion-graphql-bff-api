import {
  BookRate,
  BookReadStatus,
  BookshelfResponse,
  type Book,
} from "../types";
import { getBooks, type BookResponse } from "../apis";

const isProduction = process.env.NODE_ENV === "production";

export interface BookCache {
  Books: Book[];
  updatedAt: Date;
}

const CACHE_MAX_AGE = isProduction ? 1000 * 60 * 60 : 1000 * 60 * 5;

let cache: BookCache | null = null;

const formatBookResponse = (response: BookshelfResponse): Book[] => {
  const books = response.map((book) => {
    return {
      id: book.id,
      rate: book.properties.Rate.select
        ? book.properties.Rate.select.name
        : null,
      status: book.properties.Status.status.name,
      reading: book.properties.Reading.rich_text[0].plain_text,
      dateRead: "none",
      authorName:
        book.properties["Author Name"].rollup.array[0].title[0].plain_text,
      authorId: book.properties.Author.relation[0].id,
      title: book.properties.Title?.title[0].plain_text,
    };
  });
  return books;
};

const getAllBooks = async (): Promise<Book[]> => {
  try {
    let count = 0;
    let books: Book[] = [];
    let hasMore = true;
    let nextCursor = "";
    do {
      count++;
      const { results, has_more, next_cursor } = await getBooks({
        amount: 10,
        start: nextCursor,
      });
      const bookResponse = results as unknown as BookshelfResponse;
      const newBooks = formatBookResponse(bookResponse);
      books = [...books, ...newBooks];
      hasMore = has_more;
      nextCursor = next_cursor || "";
    } while (hasMore && count < 3);
    return Promise.resolve(books);
  } catch (error) {
    return Promise.reject(error);
  }
};

export async function getBooksFromCache(): Promise<Book[]> {
  if (cache) {
    if (cache.updatedAt.getTime() + CACHE_MAX_AGE < new Date().getTime()) {
      const books = await getAllBooks();
      setBooksToCache(books);
      return Promise.resolve(books);
    }
    return Promise.resolve(cache.Books);
  } else {
    const books = await getAllBooks();
    setBooksToCache(books);
    return Promise.resolve(books);
  }
}

export function setBooksToCache(books: Book[]): void {
  cache = {
    Books: books,
    updatedAt: new Date(),
  };
}

export function getBooksCacheUpdatedAt(): Date | null {
  if (!cache) {
    return null;
  }
  return cache.updatedAt;
}

export function clearBooksCache(): void {
  cache = null;
}

export async function getBooksByStatus(
  status: BookReadStatus
): Promise<Book[]> {
  if (!cache) {
    await getBooksFromCache();
    return await getBooksByStatus(status);
  }
  return cache.Books.filter((book) => book.status === status);
}
