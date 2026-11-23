import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const pacote = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
function git(...argumentos) {
  try { return execFileSync("git", argumentos, { cwd: new URL(".", import.meta.url), timeout: 1500, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); }
  catch { return ""; }
}
const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.ELOSOCIAL_SOURCE_COMMIT || git("rev-parse", "HEAD");
const ramo = process.env.VERCEL_GIT_COMMIT_REF || process.env.ELOSOCIAL_SOURCE_BRANCH || git("branch", "--show-current");
export default defineConfig({
  define: {
    __ELOSOCIAL_BUILD__: JSON.stringify({
      versao: pacote.version, react: pacote.dependencies.react, vite: pacote.devDependencies.vite,
      compiladoEm: new Date().toISOString(),
      commit: /^[a-f0-9]{7,40}$/i.test(commit) ? commit : null,
      ramo: /^[a-zA-Z0-9_./-]{1,100}$/.test(ramo) ? ramo : null,
      plataforma: process.env.VERCEL === "1" ? "Vercel" : "Local / outra hospedagem",
    }),
  },
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
