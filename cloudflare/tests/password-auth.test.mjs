import test from 'node:test';import assert from 'node:assert/strict';
import {validPassword,passwordHash,equalSecret,sessionToken,authenticatePassword,SESSION_MS} from '../src/password-auth.mjs';
test('password hashing uses a salt and passwords must be long and bounded',async()=>{
 assert.equal(validPassword('short'),false);assert.equal(validPassword('x'.repeat(257)),false);assert.equal(validPassword('x'.repeat(16)),true);assert.equal(validPassword('x'.repeat(16)+'\n'),false);
 const pepper='a'.repeat(64),hash=await passwordHash('a sufficiently long password','salt-one',pepper);assert.equal(hash.length,64);assert.notEqual(hash,await passwordHash('a sufficiently long password','salt-two',pepper));assert.notEqual(hash,await passwordHash('a sufficiently long password','salt-one','b'.repeat(64)));await assert.rejects(passwordHash('a sufficiently long password','salt-one',''));assert.equal(await equalSecret(hash,hash),true);assert.equal(await equalSecret(hash,'wrong'),false);
});
test('only a single correctly formed host cookie can authenticate',()=>{
 const request=value=>new Request('https://game.example/admin',{headers:{Cookie:value}}),token='a'.repeat(64);
 assert.equal(sessionToken(request('__Host-nebo_admin='+token)),token);for(const value of ['nebo_admin='+token,'__Host-nebo_admin=short','__Host-nebo_admin='+token+'; __Host-nebo_admin='+token])assert.equal(sessionToken(request(value)),null);assert.equal(SESSION_MS,28800000);
});
test('server checks the session digest and expiration; forged or expired sessions fail',async()=>{
 const token='a'.repeat(64);let argumentsSeen;
 const env={DB:{withSession:()=>({prepare:sql=>{assert.ok(sql.includes('expires_at>?'));return {bind:(...args)=>{argumentsSeen=args;return {first:async()=>({expires_at:Date.now()+1000})};}};}})}};
 assert.equal(await authenticatePassword(new Request('https://game.example/admin',{headers:{Cookie:'__Host-nebo_admin='+token}}),env),'管理者本人');assert.notEqual(argumentsSeen[0],token);assert.equal(argumentsSeen[0].length,64);assert.ok(argumentsSeen[1]<=Date.now());
 const denied={DB:{withSession:()=>({prepare:()=>({bind:()=>({first:async()=>null})})})}};await assert.rejects(authenticatePassword(new Request('https://game.example/admin',{headers:{Cookie:'__Host-nebo_admin='+token}}),denied));await assert.rejects(authenticatePassword(new Request('https://game.example/admin'),env));
});
