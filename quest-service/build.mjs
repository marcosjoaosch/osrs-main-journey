import {mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('./',import.meta.url);
await mkdir(new URL('dist/server/',root),{recursive:true});
await copyFile(new URL('worker.mjs',root),new URL('dist/server/index.js',root));
console.log('Worker build ready: '+fileURLToPath(new URL('dist/server/index.js',root)));
