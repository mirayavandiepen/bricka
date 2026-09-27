import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

const path = (relative: string) =>
  fileURLToPath(new URL(relative, import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Build the docs against the library source so they never drift.
    alias: [
      {
        find: /^@bricka\/react$/,
        replacement: path('../packages/react/src/index.ts'),
      },
      {
        find: /^@bricka\/react\/styles\.css$/,
        replacement: path('../packages/react/src/styles.css'),
      },
      { find: /^@examples\//, replacement: path('../examples/src/') },
    ],
  },
})
