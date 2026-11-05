import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  publicDir: "publico",
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        configure: (proxy) =>
          proxy.on("proxyReq", (req) =>
            req.setHeader("origin", "http://localhost:3000"),
          ),
      },
    },
  },
});
