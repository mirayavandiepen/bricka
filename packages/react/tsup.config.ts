import { copyFile } from 'node:fs/promises'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  async onSuccess() {
    await copyFile('src/styles.css', 'dist/styles.css')
  },
})
