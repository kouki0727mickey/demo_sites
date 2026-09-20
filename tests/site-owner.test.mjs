import test from 'node:test';
import assert from 'node:assert/strict';
import {isSiteOwner} from '../lib/site-owner.ts';
const owner={userId:'site-scoped-owner',email:'owner@example.com'};
test('only the authenticated configured owner can edit',()=>{assert.equal(isSiteOwner(owner,'owner@example.com'),true);assert.equal(isSiteOwner({...owner,email:' OWNER@EXAMPLE.COM '},'owner@example.com'),true);assert.equal(isSiteOwner({userId:'someone-else',email:'other@example.com'},'owner@example.com'),false);});
test('anonymous, partial identity and missing configuration fail closed',()=>{assert.equal(isSiteOwner(null,'owner@example.com'),false);assert.equal(isSiteOwner({userId:'',email:owner.email},owner.email),false);assert.equal(isSiteOwner(owner,undefined),false);assert.equal(isSiteOwner(owner,''),false);assert.equal(isSiteOwner(owner,'  '),false);});
