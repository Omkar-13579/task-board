import "dotenv/config";
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database("./database.sqlite"),

  trustedOrigins: ["http://localhost:5173"],
  
  emailAndPassword: {
    enabled: true,
  },
});
