import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

const source = (path: string) =>
  fileURLToPath(new URL(`../packages/react/src/${path}`, import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Use the library source directly for instant feedback while developing.
    alias: [
      { find: /^@bricka\/react$/, replacement: source('index.ts') },
      {
        find: /^@bricka\/react\/styles\.css$/,
        replacement: source('styles.css'),
      },
    ],
  },
})
