import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

const db = mongoose.connection.db; 

export const auth = betterAuth({
  database: mongodbAdapter(mongoose.connection.db as any),
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  emailAndPassword: {
    enabled: false
  },

  
  user: {
    modelName: "users",
  }
});