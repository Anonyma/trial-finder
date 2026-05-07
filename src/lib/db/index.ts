import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { mockDb, shouldUseMockDb } from "./mock-db";

// Check if we should use mock database for development
const useMock = shouldUseMockDb();

if (useMock) {
  console.log("[DB] Using mock database for development");
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString && !useMock) {
  throw new Error(
    "DATABASE_URL environment variable is not set.\n" +
    "To run without a database, set NEXT_PUBLIC_USE_MOCK_DB=true\n" +
    "See README.md for development options."
  );
}

// Configure connection pool. Supabase pooler handles transaction-mode pooling.
const queryClient = useMock 
  ? null 
  : postgres(connectionString!, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      // Disable prepared statements for compatibility with Supabase transaction pooler
      prepare: false,
    });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: any = useMock ? mockDb : drizzle(queryClient!, { schema });
export { schema };
export { mockDb, shouldUseMockDb } from "./mock-db";
export { mockTrials } from "./mock-data";
