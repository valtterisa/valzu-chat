import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { betterAuthDb } from "./mongodb";

type AdapterDb = Parameters<typeof mongodbAdapter>[0];

export const auth = betterAuth({
  database: mongodbAdapter(betterAuthDb as unknown as AdapterDb),
  emailAndPassword: {
    enabled: true,
  },
});
