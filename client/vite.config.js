import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // --- ADD THIS SECTION ---
    watch: {
      usePolling: true,
    },
    // ------------------------
    host: true, // Optional: exposes server to network, helpful for some setups
    strictPort: true,
    port: 5173,
  },
});
