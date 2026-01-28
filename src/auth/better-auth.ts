import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

console.log("DEBUG DB STATE:", mongoose.connection.readyState);

const db = mongoose.connection.db;

console.log("DEBUG DB STATE:", mongoose.connection.readyState);

console.log("🔧 Carregando Better Auth com Trusted Origins...");

export const auth = betterAuth({
  database: mongodbAdapter(mongoose.connection.db as any),

  baseURL: process.env.BETTER_AUTH_URL 
    ? `${process.env.BETTER_AUTH_URL}/api/auth` 
    : "http://localhost:3000/api/auth",
  clientURL: "http://localhost:3333",
  secret: process.env.BETTER_AUTH_SECRET,
  
  trustedOrigins: [
    "http://localhost:3333", 
    "http://localhost:3000"
  ],

  socialProviders: {
    google: {
      clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
    },
  },

  emailAndPassword: {
    enabled: false
  },

  
  user: {
    modelName: "users",
  }
});