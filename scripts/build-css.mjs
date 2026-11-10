// Builds css/site.min.css from the partials.
//   1. esbuild follows the @imports and joins everything into one file, so the browser
//      makes a single request instead of waiting for main.css and then each partial.
//   2. postcss-custom-media expands the named breakpoints in base/breakpoints.css into
//      plain media queries (no browser supports @custom-media yet).
//   3. esbuild minifies.
// Font urls are root-relative (/assets/...), so they are left alone and still work if
// this file is moved.
import { build, transform } from 'esbuild';
import postcss from 'postcss';
import customMedia from 'postcss-custom-media';
import { writeFile } from 'node:fs/promises';

const bundled = await build({
  entryPoints: ['css/main.css'],
  bundle: true,
  external: ['/assets/*'],
  write: false,
  logLevel: 'warning'
});

const { css } = await postcss([customMedia({ preserve: false })]).process(bundled.outputFiles[0].text, { from: undefined });
const min = await transform(css, { loader: 'css', minify: true });

await writeFile('css/site.min.css', min.code);
console.log(`css/site.min.css  ${(min.code.length / 1024).toFixed(1)} kB`);
