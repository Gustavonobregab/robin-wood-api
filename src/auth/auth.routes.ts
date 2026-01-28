import { Elysia } from "elysia";
import { auth } from "./better-auth";

export const authRoutes = new Elysia()
    .all("/api/auth/*", async (c) => {

        const res = await auth.handler(c.request);
        return res;
    });