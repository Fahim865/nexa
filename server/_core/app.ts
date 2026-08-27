import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerGoogleAuthRoutes } from "../auth/google";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerBillingWebhookRoutes } from "../billing/webhook";
import { registerMediaProcessingRoutes } from "../media/http";

/**
 * Creates the HTTP application without binding a listener.
 *
 * The standalone server and Vercel Functions share this route registration so
 * authentication, billing, tRPC, storage, and media APIs retain identical
 * server-side behavior in both deployment models.
 */
export function createApp() {
  const app = express();

  // These endpoints need their original raw bodies for signature/file handling,
  // so they must be installed before the JSON body parser.
  registerBillingWebhookRoutes(app);
  registerMediaProcessingRoutes(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerGoogleAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
