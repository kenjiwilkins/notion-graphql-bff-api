export type BookReadStatus = "read" | "reading" | "unread";
export type BookRate = 1 | 2 | 3 | 4 | 5 | "TBD" | null;

export interface Book {
  id: string;
  rate: BookRate;
  status: BookReadStatus;
  reading: string;
  dateRead: string;
  authorName: string;
  authorId: string;
  title: string;
}

export interface AuthorRollupName {
  title: [
    {
      text: {
        content: string;
      };
      plain_text: string;
    }
  ];
}

export interface BookResponseProperties {
  Rate: {
    select: BookRate;
  };
  Status: {
    status: {
      name: BookReadStatus;
    };
  };
  Author: {
    relation: [
      {
        id: string;
      }
    ];
  };
  "Author Name": {
    rollup: {
      array: AuthorRollupName[];
    };
  };
  Reading: {
    rich_text: [
      {
        text: {
          content: string;
        };
        plain_text: string;
      }
    ];
  };
  Date_Read: {
    date: {
      start: string;
    };
  };
  Title: {
    title: [
      {
        text: {
          content: string;
        };
        plain_text: string;
      }
    ];
  };
}

export interface BookResponse {
  id: string;
  properties: BookResponseProperties;
}

export type BookshelfResponse = BookResponse[];
