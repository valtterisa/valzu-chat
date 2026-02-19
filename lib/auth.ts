import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { betterAuthClient, betterAuthDb } from "./mongodb";

export const auth = betterAuth({
  database: mongodbAdapter(betterAuthDb as any, {
    client: betterAuthClient as any,
  }),
  emailAndPassword: {
    enabled: true,
  },
});
