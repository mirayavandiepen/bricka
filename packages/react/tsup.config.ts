import { copyFile } from 'node:fs/promises'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  // Next.js renders on the server first; this marks the components as client-only.
  banner: { js: "'use client'" },
  async onSuccess() {
    await copyFile('src/styles.css', 'dist/styles.css')
  },
})
