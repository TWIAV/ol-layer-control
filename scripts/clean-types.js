// Removes the stylesheet import from the generated declarations, if present.
// The CSS import is a runtime side effect of src/ol-layer-control.js; in a
// .d.ts it is meaningless and makes TypeScript projects that check library
// types (noUncheckedSideEffectImports) fail to resolve a .css module.
// TypeScript 6 leaves it out; some other compiler versions emit it.
import {readFileSync, writeFileSync} from 'node:fs';

const file = new URL('../types/ol-layer-control.d.ts', import.meta.url);
const source = readFileSync(file, 'utf8');
const cleaned = source.replace(/^import ['"]\.\/ol-layer-control\.css['"];\r?\n/m, '');
if (cleaned !== source) {
  writeFileSync(file, cleaned);
}
