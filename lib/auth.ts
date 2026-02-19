import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { betterAuthDb } from "./mongodb";
import { autumn } from "autumn-js/better-auth";

type AdapterDb = Parameters<typeof mongodbAdapter>[0];

export const auth = betterAuth({
  database: mongodbAdapter(betterAuthDb as AdapterDb),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [autumn()],
});
