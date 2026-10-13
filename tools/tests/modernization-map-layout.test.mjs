import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {convexHull,fitStopPoints,platePlacement,chapterShapes,mapOrderControl} from '../../assets/games/community-builders/engine/map-layout.js';
const points=[[9,39],[15,52],[18,77],[31,58],[31,24],[43,44],[46,72],[57,52],[68,30],[65,73],[78,53],[88,74],[91,50],[75,18],[91,20]];
for(const width of [360,414,600,768,1100,1920])test(`geographic fit keeps fifteen usable discs inside ${width}px`,()=>{
 const height=width*768/1376,diameter=Math.min(68,Math.max(44,width*.052)),fit=fitStopPoints(points,width,height,diameter);
 assert.equal(fit.length,15);assert.ok(diameter>=44);
 for(const [x,y]of fit){assert.ok(x-diameter/2>=0&&x+diameter/2<=width);assert.ok(y-diameter/2>=0&&y+diameter/2<=height);}
 for(let i=0;i<15;i++)for(let j=i+1;j<15;j++)assert.ok(Math.hypot(fit[i][0]-fit[j][0],fit[i][1]-fit[j][1])>=diameter+7.8,`Discs ${i+1}/${j+1} remain separate`);
 assert.deepEqual(fitStopPoints(points,width,height,diameter),fit,'Layout is deterministic');
});
test('plate placement tries four directions, never covers another disc, and hides if none fits',()=>{
 const a={left:100,top:100,right:144,bottom:144},size={width:70,height:30},bounds={left:0,top:0,right:300,bottom:300};
 assert.equal(platePlacement(a,size,bounds,[]).side,'above');
 const top={left:70,top:50,right:170,bottom:99},bottom={left:70,top:145,right:170,bottom:200},left={left:0,top:80,right:99,bottom:170},right={left:145,top:80,right:260,bottom:170};
 assert.equal(platePlacement(a,size,bounds,[top]).side,'below');assert.equal(platePlacement(a,size,bounds,[top,bottom]).side,'left');assert.equal(platePlacement(a,size,bounds,[top,bottom,left]).side,'right');assert.equal(platePlacement(a,size,bounds,[top,bottom,left,right]),null);
});
test('chapter hulls use the real stop chapter membership and namespace-safe SVG nodes',()=>{
 const d=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>');try{const svg=d.window.document.querySelector('svg'),ctx={document:d.window.document,SVGNS:svg.namespaceURI,STOPS:points.map((_,i)=>({chap:i<6?1:i<9?2:i<13?3:4}))};chapterShapes(ctx,svg,points);assert.equal(svg.querySelectorAll('polygon').length,4);for(const p of svg.querySelectorAll('polygon'))assert.equal(p.namespaceURI,svg.namespaceURI);chapterShapes(ctx,svg,points);assert.equal(svg.querySelectorAll('.cb-map-chapters').length,1);assert.deepEqual(convexHull([[0,0],[1,0],[1,1],[0,1],[.5,.5]]),[[0,0],[1,0],[1,1],[0,1]]);}finally{d.window.close();}
});
test('adult play-order switch persists a choice and redraws the map without score mutation',()=>{
 const d=new JSDOM('<main></main>');try{let saved=0,maps=0;const ctx={uid:0,mode:'map',window:d.window,CFG:{},W:{mapPlayInOrder:'Play stops in order',mapOrderHelp:'Finish the first stop.'},cfgSave(){saved++;},showMap(){maps++;},h(tag,attrs={},kids=[]){const n=d.window.document.createElement(tag);for(const[k,v]of Object.entries(attrs))k==='text'?n.textContent=v:n.setAttribute(k,v);for(const kid of kids)if(kid)n.append(kid);return n;}};const wrap=mapOrderControl(ctx),input=wrap.querySelector('input');assert.equal(input.checked,false);input.checked=true;input.dispatchEvent(new d.window.Event('change'));assert.equal(ctx.CFG.playInOrder,true);assert.equal(saved,1);assert.equal(maps,1);}finally{d.window.close();}
});
