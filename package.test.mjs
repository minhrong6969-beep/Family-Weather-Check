import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
test('widget exists and includes an accessible collapsible control',()=>{
 const index=readFileSync(join(root,'site/index.html'),'utf8');
 const js=readFileSync(join(root,'site/assets/app.mjs'),'utf8');
 const css=readFileSync(join(root,'site/assets/themes.css'),'utf8');
 assert.match(index,/id="family-floating-root"/);
 assert.match(js,/aria-controls="fg-panel"/);
 assert.match(js,/aria-expanded="false"/);
 assert.match(js,/getFloatingMembers\(/);
 assert.match(js,/setFloatingOpen\(/);
 assert.match(css,/\.fg-member/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.ok(existsSync(join(root,'site/assets/floating-group.mjs')));
});
test('client map supports focusing selected member without disclosing their private GPS',()=>{
 const js=readFileSync(join(root,'site/assets/app.mjs'),'utf8');
 const map=readFileSync(join(root,'site/assets/weather-map.mjs'),'utf8');
 assert.match(js,/member\.id===state\.meId \? locationEffective\(member\) : city/);
 assert.match(js,/focusWeatherLocation\(/);
 assert.match(map,/export function focusWeatherLocation/);
});
test('online and drop static assets are byte identical',()=>{
 for(const p of ['index.html','assets/app.mjs','assets/weather-map.mjs','assets/floating-group.mjs','assets/themes.css']) {
  assert.equal(readFileSync(join(root,p),'utf8'),readFileSync(join(root,'site',p),'utf8'));
 }
});
