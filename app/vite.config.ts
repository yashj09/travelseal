import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

const REST = "https://api-testnet.qore.host"

/**
 * Local demo only: `vite dev` hands the browser the demo accounts' testnet mnemonics from ../.secrets so it can seal,
 * sign and decrypt client-side. `apply: "serve"` keeps this out of every production build, which runs in replay mode.
 */
function devKeys(): Plugin {
  const file = resolve(import.meta.dirname, "../.secrets/mnemonics.json")
  return {
    name: "travelseal-dev-keys",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__dev/keys", (req, res) => {
        const local = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress ?? "")
        if (!local || !existsSync(file)) {
          res.statusCode = 404
          return res.end()
        }
        res.setHeader("content-type", "application/json")
        res.end(readFileSync(file))
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devKeys()],
  resolve: { alias: { "@": resolve(import.meta.dirname, "./src") } },
  define: { global: "globalThis" },
  server: {
    host: "127.0.0.1",
    // Public REST sends no CORS headers, so the browser reaches it through this same-origin path (vercel.json does the same in production).
    proxy: { "/lcd": { target: REST, changeOrigin: true, rewrite: (p) => p.replace(/^\/lcd/, "") } },
  },
})
