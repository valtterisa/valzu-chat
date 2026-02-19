import { Autumn } from "autumn-js";

const autumnSecretKey = process.env.AUTUMN_SECRET_KEY;

if (!autumnSecretKey) {
  throw new Error("AUTUMN_SECRET_KEY is not set");
}

export const autumn = new Autumn({
  secretKey: autumnSecretKey,
});
