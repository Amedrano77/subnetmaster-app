import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()]
})
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "YOUR_ORG_SLUG",
      project: "YOUR_PROJECT_SLUG",
      authToken: process.env.SENTRY_AUTH_TOKEN, // set this in your env
    }),
  ],
});
