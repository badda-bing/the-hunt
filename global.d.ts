// global.d.ts — ambient module declarations.
// CSS side-effect imports are resolved by Next/webpack at build time;
// TypeScript just needs to know they exist.
declare module '*.css' {}
