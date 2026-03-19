import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3002';
const clientURL = process.env.CLIENT_URL || 'http://localhost:3333';

export const auth = betterAuth({
  database: mongodbAdapter(mongoose.connection.db as any),
  baseURL,
  clientURL,
  trustedOrigins: [clientURL],
  socialProviders: {
    google: {
      clientId: googleId as string,
      clientSecret: googleSecret as string,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  user: {
    modelName: "users",
  }
});
