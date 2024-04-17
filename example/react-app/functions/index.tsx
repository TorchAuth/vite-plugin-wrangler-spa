import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono().basePath("/api");

const route = app
  .get(
    "/hello",
    zValidator(
      "query",
      z.object({
        name: z.string(),
      })
    ),
    (c) => {
      return c.json({
        test: true,
      });
    }
  )
  .get("/page", (c) => {
    return c.html(
      <html>
        <body>
          <div>HERE's Some content!!</div>
        </body>
      </html>
    );
  });

export type AppType = typeof route;

export default app;
