import test from 'node:test';
import assert from 'node:assert/strict';
import {assessForecast} from '../assets/weather-risk.mjs';

const seq=(gust,rain,n=24)=>({wind_gusts_10m:Array(n).fill(gust),precipitation:Array(n).fill(rain)});
test('selected location returns exactly the green, yellow and red risk levels',()=>{
  assert.equal(assessForecast(seq(22,2)).level,'safe');
  assert.equal(assessForecast(seq(55,2)).level,'watch');
  assert.equal(assessForecast(seq(22,12)).level,'watch');
  assert.equal(assessForecast(seq(78,2)).level,'danger');
  assert.equal(assessForecast(seq(22,21)).level,'danger');
});
test('missing data is UNKNOWN, not falsely SAFE',()=>{
  assert.equal(assessForecast({}).level,'unknown');
  assert.equal(assessForecast(seq(8,0,2)).level,'unknown');
  assert.equal(assessForecast({wind_gusts_10m:Array(24).fill(10),precipitation:[]}).level,'unknown');
  assert.equal(assessForecast({wind_gusts_10m:[95],precipitation:[]}).level,'danger');
});
test('forecast risk uses only 24 hours from the selected point in time',()=>{
  const d=seq(8,1,48); d.wind_gusts_10m[30]=120;
  assert.equal(assessForecast(d,0).level,'safe');
  assert.equal(assessForecast(d,24).level,'danger');
});
