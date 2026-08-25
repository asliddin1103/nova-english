import path from "node:path";
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrate: {
    async adapter() {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const { Pool } = await import("pg");
      const connectionString = process.env.DATABASE_URL!;
      const isCloudDB = !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1");
      const pool = new Pool({
        connectionString,
        // Enable SSL for cloud providers (Neon, Supabase, Railway, etc.)
        ssl: isCloudDB ? { rejectUnauthorized: false } : false,
      });
      return new PrismaPg(pool);
    },
  },
});