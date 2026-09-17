import test from 'node:test';
import assert from 'node:assert/strict';
import { mayRevealDashboard, withTimeout, type SplashGate } from '../src/domain/splash-policy.ts';
const base: SplashGate = {ready:false,minimumElapsed:false,mediaFailed:false,mediaExpired:false,skipped:false,reducedMotion:false};
for (const flag of ['minimumElapsed','mediaFailed','mediaExpired','skipped','reducedMotion'] as const) {
 test(`must not reveal unready data even when ${flag}`,() => assert.equal(mayRevealDashboard({...base,[flag]:true}),false));
 test(`reveal ready data when ${flag}`,() => assert.equal(mayRevealDashboard({...base,ready:true,[flag]:true}),true));
}
test('minimum branding window for ready app',() => assert.equal(mayRevealDashboard({...base,ready:true}),false));
test('fulfilled bootstrap',async() => assert.equal(await withTimeout(Promise.resolve('ready'),100),'ready'));
test('bootstrap rejection',async() => {await assert.rejects(withTimeout(Promise.reject(new Error('broken')),100),/broken/);});
test('hung bootstrap becomes a retryable error',async() => {await assert.rejects(withTimeout(new Promise(()=>{}),10),/chargement/);});
test('aborted bootstrap',async() => {const c=new AbortController();const p=withTimeout(new Promise(()=>{}),1000,c.signal);c.abort();await assert.rejects(p,/annul/);});
test('already aborted bootstrap',async() => {const c=new AbortController();c.abort();await assert.rejects(withTimeout(Promise.resolve('ready'),100,c.signal),/annul/);});

test('already aborted rejected work is still observed',async() => {const c=new AbortController();c.abort();await assert.rejects(withTimeout(Promise.reject(new Error('late')),100,c.signal),/annul/);});
