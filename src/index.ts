import "dotenv/config";
import { ApolloServer, gql } from "apollo-server";
import {
  getBooksFromCache,
  getRecipeTagsFromCache,
  getBooksByStatus,
} from "./cache";
import { GraphQLScalarType, Kind } from "graphql";
import { BookReadStatus } from "./types";

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ratingScalar = new GraphQLScalarType({
  name: "Rating",
  description: "Rating custom scalar type for values between 0 and 5",
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return validateRating(parseInt(value as string));
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return validateRating(parseInt(ast.value, 10));
    }
    return null;
  },
});

function validateRating(value: number) {
  if (value < 0 || value > 5) {
    throw new Error("Rating must be between 0 and 5");
  }
  return value;
}

const typeDefs = gql`
  scalar Rating
  enum Status {
    read
    reading
    unread
  }
  type Query {
    hello: String
    wait(ms: Int!): String
    book: BookResult
    bookByStatus(status: Status): BookResult
    recipeTags: [RecipeTag]
    recipeTagByTitle(title: String!): RecipeTagsOrError
    bookById(id: ID!): BookOrError
  }
  type BookResult {
    totalCount: Int!
    books: [Book]
  }
  type Book {
    id: ID!
    title: String!
    status: Status
    rate: Rating
    authorName: String
    authorId: String
  }
  type RecipeTag {
    id: ID!
    title: String!
    relatedRecipes: [RecipeRelation]
  }
  type RecipeRelation {
    id: ID!
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
  Rating: ratingScalar,
  Query: {
    hello: async () => {
      const now = new Date();
      return `Hello world! at ${now.toLocaleDateString()}: ${now.toLocaleTimeString()}`;
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
        return {
          totalCount: books.length,
          books: books,
        };
      } catch (error) {
        console.error(error);
      }
    },
    bookByStatus: async (_: any, { status }: { status: BookReadStatus }) => {
      const books = await getBooksByStatus(status);
      return {
        totalCount: books.length,
        books: books,
      };
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

getBooksFromCache();
