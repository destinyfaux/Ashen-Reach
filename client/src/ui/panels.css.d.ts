// Type shim for CSS imports: main.ts imports './ui/panels.css' so esbuild
// bundles the panel styles into client/public/app.css (index.html links it).
// TypeScript needs this wildcard module declaration to accept the import.
// (tsconfig includes client/src/**/*.ts, so this file is picked up.)
declare module '*.css';
