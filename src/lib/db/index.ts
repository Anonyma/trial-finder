import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Configure connection pool. Supabase pooler handles transaction-mode pooling.
const queryClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  // Disable prepared statements for compatibility with Supabase transaction pooler
  prepare: false,
});

export const db = drizzle(queryClient, { schema });
export { schema };
