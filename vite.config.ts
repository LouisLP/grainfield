import { svelte } from '@sveltejs/vite-plugin-svelte'
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

// base is /grainfield/ in production for GitHub Pages project-site hosting
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/grainfield/' : '/',
  plugins: [svelte()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
