import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{js,jsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    env: { VITE_CLOUDINARY_BASE_URL: 'https://res.cloudinary.com/demo/image/upload/' },
  },
});
