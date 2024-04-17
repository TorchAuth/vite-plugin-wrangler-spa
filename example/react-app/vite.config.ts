import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import viteWranglerSpa from "vite-wrangler-spa";

export default defineConfig({
  build: {
    minify: false,
  },
  plugins: [
    react(),
    viteWranglerSpa({
      functionEntrypoint: "functions/index.tsx",
    }),
  ],
});
