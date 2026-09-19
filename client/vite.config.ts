import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server runs on 5173 (Vite default). The Node server expects this origin
// for CORS. Host is exposed so you can also test from a phone on the same LAN.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    // Split large third-party deps into their own cacheable chunks and keep
    // them out of the initial landing bundle where possible.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          // socket.io is only needed inside the lazy Session chunk.
          if (id.includes("socket.io") || id.includes("engine.io")) {
            return "socket-vendor";
          }
          // Icons are tree-shaken; group the used ones together.
          if (id.includes("lucide-react")) return "icons-vendor";
          // Headless UI is only used by the lazy Guidelines chunk — leave it
          // unassigned so Rollup keeps it with that dynamic import.
          if (id.includes("@headlessui")) return undefined;
          // React + its runtime deps form the core vendor chunk.
          return "vendor";
        },
      },
    },
  },
});
