// Vite serves and builds the demo app in ./demo. The library itself
// (./src) is published as plain ES modules and needs no build step.
export default {
  root: 'demo',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
  },
};
