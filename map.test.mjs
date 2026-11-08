import test from 'node:test';
import assert from 'node:assert/strict';
import {weatherMapMarkup} from '../assets/weather-map.mjs';
import {readFileSync} from 'node:fs';

test('weather map is available without a family group in both languages',()=>{
 const vi=weatherMapMarkup('vi');
 const en=weatherMapMarkup('en');
 assert.match(vi,/Bản đồ thời tiết/);
 assert.match(en,/Weather map/);
 for(const html of [vi,en]){
  for(const id of ['weather-leaflet','map-radar','map-cyclones','weather-point-details','hourly-forecast','daily-forecast','map-search','risk-overview','map-search-results']) assert.ok(html.includes(`id="${id}"`), id);
  assert.match(html,/open-meteo\.com/);
  assert.match(html,/rainviewer\.com/);
  assert.match(html,/gdacs\.org/);
  assert.match(html,/risk-scale-safe/);
  assert.match(html,/risk-scale-watch/);
  assert.match(html,/risk-scale-danger/);
 }
});
test('map is first in navigation, preferences have both palettes, pages are wired',()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/app.mjs',import.meta.url),'utf8');
 const css=readFileSync(new URL('../assets/themes.css',import.meta.url),'utf8');
 assert.ok(html.indexOf('data-page="map"')<html.indexOf('data-page="dashboard"'));
 assert.match(app,/page:'map'/);
 assert.match(app,/weatherMapMarkup\(state.lang\)/);
 assert.match(app,/mountWeatherMap\(\)/);
 assert.match(app,/theme-palette/);
 assert.match(app,/whiteBlack/);
 assert.match(app,/whiteNavy/);
 assert.match(css,/\[data-theme="mono"\]/);
 assert.match(css,/\[data-theme="navy"\]/);
});
