// vite.config.ts
import tailwindcss from "file:///app/applet/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///app/applet/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { defineConfig } from "file:///app/applet/node_modules/vite/dist/node/index.js";
import { VitePWA } from "file:///app/applet/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "/app/applet";
var vite_config_default = defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["icon.svg", "apple-touch-icon.png", "pwa-192x192.png", "pwa-512x512.png"],
        manifest: {
          id: "/",
          name: "AutoGestion - Carnet de Bord",
          short_name: "AutoGestion",
          description: "Application mobile de gestion de v\xE9hicule avec suivi d'entretien, carburant et conformit\xE9.",
          theme_color: "#0A0A0A",
          background_color: "#0A0A0A",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          scope: "/",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/pwa-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ]
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,jpg}"]
        },
        devOptions: {
          enabled: false
        }
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, ".")
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === "true" ? null : {}
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlUm9vdCI6ICIvYXBwL2FwcGxldC8iLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9hcHAvYXBwbGV0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvYXBwL2FwcGxldC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYXBwL2FwcGxldC92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB0YWlsd2luZGNzcyBmcm9tICdAdGFpbHdpbmRjc3Mvdml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQge2RlZmluZUNvbmZpZ30gZnJvbSAndml0ZSc7XG5pbXBvcnQge1ZpdGVQV0F9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoKSA9PiB7XG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW1xuICAgICAgcmVhY3QoKSxcbiAgICAgIHRhaWx3aW5kY3NzKCksXG4gICAgICBWaXRlUFdBKHtcbiAgICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXG4gICAgICAgIGluY2x1ZGVBc3NldHM6IFsnaWNvbi5zdmcnLCAnYXBwbGUtdG91Y2gtaWNvbi5wbmcnLCAncHdhLTE5MngxOTIucG5nJywgJ3B3YS01MTJ4NTEyLnBuZyddLFxuICAgICAgICBtYW5pZmVzdDoge1xuICAgICAgICAgIGlkOiAnLycsXG4gICAgICAgICAgbmFtZTogJ0F1dG9HZXN0aW9uIC0gQ2FybmV0IGRlIEJvcmQnLFxuICAgICAgICAgIHNob3J0X25hbWU6ICdBdXRvR2VzdGlvbicsXG4gICAgICAgICAgZGVzY3JpcHRpb246IFwiQXBwbGljYXRpb24gbW9iaWxlIGRlIGdlc3Rpb24gZGUgdlx1MDBFOWhpY3VsZSBhdmVjIHN1aXZpIGQnZW50cmV0aWVuLCBjYXJidXJhbnQgZXQgY29uZm9ybWl0XHUwMEU5LlwiLFxuICAgICAgICAgIHRoZW1lX2NvbG9yOiAnIzBBMEEwQScsXG4gICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyMwQTBBMEEnLFxuICAgICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcbiAgICAgICAgICBvcmllbnRhdGlvbjogJ3BvcnRyYWl0JyxcbiAgICAgICAgICBzdGFydF91cmw6ICcvJyxcbiAgICAgICAgICBzY29wZTogJy8nLFxuICAgICAgICAgIGljb25zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHNyYzogJy9wd2EtMTkyeDE5Mi5wbmcnLFxuICAgICAgICAgICAgICBzaXplczogJzE5MngxOTInLFxuICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgICAgcHVycG9zZTogJ2FueScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6ICcvcHdhLTUxMng1MTIucG5nJyxcbiAgICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICAgIHB1cnBvc2U6ICdhbnknLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiAnL3B3YS1tYXNrYWJsZS01MTJ4NTEyLnBuZycsXG4gICAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXG4gICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgICBwdXJwb3NlOiAnbWFza2FibGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB3b3JrYm94OiB7XG4gICAgICAgICAgZ2xvYlBhdHRlcm5zOiBbJyoqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnLHdvZmYsd29mZjIsanBnfSddLFxuICAgICAgICB9LFxuICAgICAgICBkZXZPcHRpb25zOiB7XG4gICAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICBdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4nKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIC8vIEhNUiBpcyBkaXNhYmxlZCBpbiBBSSBTdHVkaW8gdmlhIERJU0FCTEVfSE1SIGVudiB2YXIuXG4gICAgICAvLyBEbyBub3QgbW9kaWZ5XHUwMEUyXHUwMDgwXHUwMDk0ZmlsZSB3YXRjaGluZyBpcyBkaXNhYmxlZCB0byBwcmV2ZW50IGZsaWNrZXJpbmcgZHVyaW5nIGFnZW50IGVkaXRzLlxuICAgICAgaG1yOiBwcm9jZXNzLmVudi5ESVNBQkxFX0hNUiAhPT0gJ3RydWUnLFxuICAgICAgLy8gRGlzYWJsZSBmaWxlIHdhdGNoaW5nIHdoZW4gRElTQUJMRV9ITVIgaXMgdHJ1ZSB0byBzYXZlIENQVSBkdXJpbmcgYWdlbnQgZWRpdHMuXG4gICAgICB3YXRjaDogcHJvY2Vzcy5lbnYuRElTQUJMRV9ITVIgPT09ICd0cnVlJyA/IG51bGwgOiB7fSxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW1OLE9BQU8saUJBQWlCO0FBQzNPLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUSxvQkFBbUI7QUFDM0IsU0FBUSxlQUFjO0FBSnRCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxNQUFNO0FBQ2hDLFNBQU87QUFBQSxJQUNMLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxRQUNkLGVBQWUsQ0FBQyxZQUFZLHdCQUF3QixtQkFBbUIsaUJBQWlCO0FBQUEsUUFDeEYsVUFBVTtBQUFBLFVBQ1IsSUFBSTtBQUFBLFVBQ0osTUFBTTtBQUFBLFVBQ04sWUFBWTtBQUFBLFVBQ1osYUFBYTtBQUFBLFVBQ2IsYUFBYTtBQUFBLFVBQ2Isa0JBQWtCO0FBQUEsVUFDbEIsU0FBUztBQUFBLFVBQ1QsYUFBYTtBQUFBLFVBQ2IsV0FBVztBQUFBLFVBQ1gsT0FBTztBQUFBLFVBQ1AsT0FBTztBQUFBLFlBQ0w7QUFBQSxjQUNFLEtBQUs7QUFBQSxjQUNMLE9BQU87QUFBQSxjQUNQLE1BQU07QUFBQSxjQUNOLFNBQVM7QUFBQSxZQUNYO0FBQUEsWUFDQTtBQUFBLGNBQ0UsS0FBSztBQUFBLGNBQ0wsT0FBTztBQUFBLGNBQ1AsTUFBTTtBQUFBLGNBQ04sU0FBUztBQUFBLFlBQ1g7QUFBQSxZQUNBO0FBQUEsY0FDRSxLQUFLO0FBQUEsY0FDTCxPQUFPO0FBQUEsY0FDUCxNQUFNO0FBQUEsY0FDTixTQUFTO0FBQUEsWUFDWDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsUUFDQSxTQUFTO0FBQUEsVUFDUCxjQUFjLENBQUMsK0NBQStDO0FBQUEsUUFDaEU7QUFBQSxRQUNBLFlBQVk7QUFBQSxVQUNWLFNBQVM7QUFBQSxRQUNYO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsR0FBRztBQUFBLE1BQ2xDO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBO0FBQUE7QUFBQSxNQUdOLEtBQUssUUFBUSxJQUFJLGdCQUFnQjtBQUFBO0FBQUEsTUFFakMsT0FBTyxRQUFRLElBQUksZ0JBQWdCLFNBQVMsT0FBTyxDQUFDO0FBQUEsSUFDdEQ7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
