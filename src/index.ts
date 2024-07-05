import "dotenv/config";

import { ApolloServer, gql } from "apollo-server";
import { getRecipeTags } from "./apis";
import sessions from "./sessions.json";
import { getBooksFromCache, getRecipeTagsFromCache } from "./cache";

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const typeDefs = gql`
  enum BookReadStatus {
    Reading
    Read
    unread
  }
  type Query {
    sessions: [Session]
    hello: String
    wait(ms: Int!): String
    book: [Book]
    recipeTags: [RecipeTag]
    recipeTagByTitle(title: String!): RecipeTagsOrError
    bookById(id: ID!): BookOrError
  }
  type Session {
    id: ID!
    title: String!
    description: String
    startsAt: String
    endsAt: String
    room: String
    day: String
    format: String
    track: String
      @deprecated(
        reason: "Too many sessions do not fit into a single track, consider using tags"
      )
    level: String
  }
  type Book {
    id: ID!
    title: String!
    status: BookReadStatus
    authorName: String
    authorId: String
  }
  type RecipeTag {
    id: ID!
    title: String!
  }
  type Error {
    message: String!
    code: Int!
  }
  union BookOrError = Book | Error
  union RecipeTagsOrError = RecipeTag | Error
`;

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    hello: async () => {
      const now = new Date();
      return `Hello world! at ${now.toLocaleDateString()}: ${now.toLocaleTimeString()}`;
    },
    sessions: () => {
      return sessions;
    },
    wait: async (_: any, { ms }: { ms: number }) => {
      const now = new Date();
      await wait(ms);
      return `waited for ${ms} ms from ${now.toLocaleDateString()}: ${now.toLocaleTimeString()} to ${new Date().toLocaleDateString()}: ${new Date().toLocaleTimeString()}`;
    },
    recipeTags: async () => {
      try {
        const recipeTags = await getRecipeTagsFromCache();
        return recipeTags;
      } catch (error) {
        console.error(error);
        return {
          message: "Internal server error",
          code: 500,
        };
      }
    },
    book: async () => {
      try {
        const books = await getBooksFromCache();
        return books;
      } catch (error) {
        console.error(error);
      }
    },
    bookById: async (_: any, { id }: { id: string }) => {
      try {
        const books = await getBooksFromCache();
        const book = books.find((book) => book.id === id);
        if (!book) {
          console.log(`Book not found with id: ${id}`);
          return {
            message: "Book not found",
            code: 404,
          };
        }
        return book;
      } catch (error) {
        console.error(error);
        return {
          message: "Internal server error",
          code: 500,
        };
      }
    },
  },
  BookOrError: {
    __resolveType(obj: any) {
      if (obj.message) {
        return "Error";
      } else {
        return "Book";
      }
    },
  },
  RecipeTagsOrError: {
    __resolveType(obj: any) {
      if (obj.message) {
        return "Error";
      } else {
        return "RecipeTag";
      }
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
