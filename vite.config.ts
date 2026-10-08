import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import generateHandler from "./api/generate";

const localGeminiApi = {
  name: "local-gemini-api",
  configureServer(server: any) {
    server.middlewares.use("/api/generate", (req: any, res: any, next: any) => {
      void generateHandler(req, res).catch(next);
    });
  }
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  // Available only to the Node.js API handler; never substitute it into browser bundles.
  if (env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }

  return {
    server: {
      port: 3000,
      host: "0.0.0.0"
    },
    plugins: [react(), tailwindcss(), localGeminiApi],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, ".")
      }
    }
  };
});
