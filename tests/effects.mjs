/* Regression tests for the short-final-section bug and the animation lifecycle. */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(fileURLToPath(new URL('../assets/js/effects.js',import.meta.url)),'utf8');
function eventTarget(){const listeners=new Map();return{listeners,addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn)},removeEventListener(type,fn){listeners.get(type)?.delete(fn)},fire(type,event={}){for(const fn of listeners.get(type)||[])fn(event)},count(type){return listeners.get(type)?.size||0}}}
function harness(){
  const frames=new Map(),timers=new Map();let sequence=0,drawn=0;
  const document=Object.assign(eventTarget(),{hidden:false,documentElement:{scrollHeight:1900,dataset:{theme:'dark'}}});
  const root=Object.assign(eventTarget(),{dataset:{}});
  const c=Object.assign(eventTarget(),{NOVA:{},document,innerHeight:900,innerWidth:1440,devicePixelRatio:3,scrollY:0,Math,
    requestAnimationFrame(fn){const id=++sequence;frames.set(id,fn);return id},cancelAnimationFrame(id){frames.delete(id)},
    setTimeout(fn){const id=++sequence;timers.set(id,fn);return id},clearTimeout(id){timers.delete(id)}});
  c.window=c;vm.createContext(c);vm.runInContext(source,c);
  const ids=['home','about','contact'],tops=[100,700,1300];
  const links=ids.map(id=>({id,attrs:{href:'#'+id},getAttribute(k){return this.attrs[k]},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},closest(){return this}}));
  const sections=Object.fromEntries(ids.map((id,i)=>['#'+id,{getBoundingClientRect:()=>({top:tops[i]-c.scrollY})}]));
  root.querySelectorAll=()=>links;root.querySelector=q=>q==='.site-header'?{getBoundingClientRect:()=>({bottom:86})}:sections[q];
  const ctx={setTransform(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){drawn++},fill(){}};
  const canvas={getContext:()=>ctx,width:0,height:0};
  const flush=(time=100)=>{const pending=[...frames];for(const [id,fn]of pending){frames.delete(id);fn(time)}};
  return{c,document,root,canvas,links,frames,timers,flush,drawn:()=>drawn,active:()=>links.find(l=>l.attrs['aria-current'])?.id};
}
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name)}
check('Contact becomes active at the real page end even below the observation threshold',()=>{
  const t=harness();const stop=t.c.NOVA.mountSectionNavigation(t.root);t.flush();assert.equal(t.active(),'home');
  t.c.scrollY=600;t.c.fire('scroll');t.flush();assert.equal(t.active(),'about');
  t.c.scrollY=1000;t.c.fire('scroll');t.flush();assert.equal(t.active(),'contact');
  t.c.scrollY=100;t.c.fire('scroll');t.flush();assert.equal(t.active(),'home');stop();
});
check('anchor clicks highlight immediately and scroll interruption restores the current section',()=>{
  const t=harness(),stop=t.c.NOVA.mountSectionNavigation(t.root);t.flush();
  t.root.fire('click',{target:t.links[2]});assert.equal(t.active(),'contact');t.c.scrollY=500;t.c.fire('scroll');t.flush();assert.equal(t.active(),'contact');
  t.c.fire('wheel');t.flush();assert.equal(t.active(),'about');
  t.root.fire('click',{target:t.links[2]});t.c.scrollY=1000;t.c.fire('scrollend');t.flush();assert.equal(t.active(),'contact');stop();
});
check('navigation remounting removes old listeners, frames, and smooth-scroll timers',()=>{
  const t=harness();for(let i=0;i<3;i++){const stop=t.c.NOVA.mountSectionNavigation(t.root);t.root.fire('click',{target:t.links[2]});assert.equal(t.c.count('scroll'),1);stop();assert.equal(t.c.count('scroll'),0);assert.equal(t.root.count('click'),0);assert.equal(t.document.count('keydown'),0);assert.equal(t.frames.size,0);assert.equal(t.timers.size,0)}
});
check('particles respect pixel/point limits and pause on hidden pages',()=>{
  const t=harness(),stop=t.c.NOVA.mountParticles(t.canvas,t.root,true);assert.equal(t.canvas.width,2160);assert.equal(t.canvas.height,1350);assert(t.drawn()>=18&&t.drawn()<=74);assert.equal(t.frames.size,1);
  t.flush(100);assert.equal(t.frames.size,1);t.document.hidden=true;t.document.fire('visibilitychange');assert.equal(t.frames.size,0);assert.equal(t.root.dataset.visibility,'hidden');
  t.document.hidden=false;t.document.fire('visibilitychange');assert.equal(t.frames.size,1);t.c.fire('pagehide');assert.equal(t.frames.size,0);t.c.fire('pageshow');assert.equal(t.frames.size,1);stop();assert.equal(t.frames.size,0);assert.equal(t.document.count('visibilitychange'),0);assert.equal(t.c.count('resize'),0);
});
check('system reduced motion produces a static field with no animation loop',()=>{
  const t=harness();t.c.innerWidth=390;t.c.innerHeight=844;const stop=t.c.NOVA.mountParticles(t.canvas,t.root,false);assert.equal(t.drawn(),18);assert.equal(t.frames.size,0);t.document.fire('visibilitychange');assert.equal(t.frames.size,0);stop();
});
check('unsupported canvas leaves the public page usable',()=>{const t=harness();const stop=t.c.NOVA.mountParticles({getContext:()=>null},t.root,true);assert.equal(typeof stop,'function');stop();assert.equal(t.frames.size,0)});
console.log(`\n${checks} navigation/effect checks passed without a real browser.`);
