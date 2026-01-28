import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleId || !googleSecret) {
  console.error("🚨 ERRO CRÍTICO: As chaves do Google não foram lidas do .env!");
}

export const auth = betterAuth({
  database: mongodbAdapter(mongoose.connection.db as any),

  // Forçando a URL correta sem lógica complexa
  baseURL: "http://localhost:3000/api/auth", 
  
  // URL do Front
  clientURL: "http://localhost:3333",
  
  trustedOrigins: [
    "http://localhost:3333", 
    "http://localhost:3000"
  ],

  socialProviders: {
    google: {
      clientId: googleId as string,
      clientSecret: googleSecret as string,
    },
  },

  secret: process.env.BETTER_AUTH_SECRET || "segredo_debug_123",
  
  user: {
    modelName: "users",
  }
});