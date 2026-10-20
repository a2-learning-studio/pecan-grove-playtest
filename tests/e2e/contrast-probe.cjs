const sharp = require('sharp');
function parseColor(value) {
  const parts=String(value).match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/);
  if(!parts)throw new Error(`Unsupported computed color: ${value}`);
  return [Number(parts[1]),Number(parts[2]),Number(parts[3]),parts[4]===undefined?1:Number(parts[4])];
}
function composite(front,back,opacity=1){const a=(front[3]??1)*opacity;return front.slice(0,3).map((v,i)=>v*a+back[i]*(1-a));}
function luminance(rgb){return rgb.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);}
function contrastRatio(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
// An opaque fill hides the map. A transformed map screenshot can still sample
// the photograph beside the plate, so trust the computed fill when it is solid.
function opaqueBackground(layers){
 let covered=1;
 for(const layer of layers){
  const color=parseColor(layer.backgroundColor),opacity=Number(layer.opacity);
  if(!Number.isFinite(opacity)||opacity<0||opacity>1)return null;
  covered*=opacity;
  if(color[3]===0)continue;
  if(color[3]===1&&covered===1)return color.slice(0,3);
  return null;
 }
 return null;
}
async function renderedLabelContrast(page,selector){
 const labels=page.locator(selector),results=[];
 for(let index=0;index<await labels.count();index++){
  const node=labels.nth(index);if(!await node.isVisible())continue;
  const info=await node.evaluate(el=>{
   const nodes=[el,...el.querySelectorAll('*')],colors=[];
   for(const n of nodes)if([...n.childNodes].some(c=>c.nodeType===3&&c.textContent.trim())){let opacity=1;for(let a=n;a;a=a.parentElement)opacity*=Number(getComputedStyle(a).opacity);colors.push({color:getComputedStyle(n).color,opacity});}
   const s=getComputedStyle(el),layers=[];
   for(let n=el;n;n=n.parentElement){const style=getComputedStyle(n);layers.push({backgroundColor:style.backgroundColor,opacity:Number(style.opacity)});}
   return{text:el.textContent.trim(),colors,layers,border:Math.max(...['Top','Right','Bottom','Left'].map(side=>parseFloat(s[`border${side}Width`])||0)),font:parseFloat(s.fontSize),opacity:Number(s.opacity)};
  });
  if(!info.colors.length)continue;
  const solid=opaqueBackground(info.layers);
  if(solid){let ratio=Infinity;for(const foreground of info.colors)ratio=Math.min(ratio,contrastRatio(composite(parseColor(foreground.color),solid,foreground.opacity),solid));results.push({...info,ratio});continue;}
  // Remove foreground paint to sample the composited background.
  // Firefox can keep glyphs from a transformed map button in the screenshot
  // after color becomes transparent, so the text nodes are cleared and restored too.
  await node.evaluate(el=>{const box=el.getBoundingClientRect(),texts=[];el.__pgContrastBox={width:el.style.getPropertyValue('width'),widthPriority:el.style.getPropertyPriority('width'),height:el.style.getPropertyValue('height'),heightPriority:el.style.getPropertyPriority('height'),shadow:el.style.getPropertyValue('box-shadow'),shadowPriority:el.style.getPropertyPriority('box-shadow')};el.style.setProperty('width',box.width+'px','important');el.style.setProperty('height',box.height+'px','important');el.style.setProperty('box-shadow','none','important');for(const n of [el,...el.querySelectorAll('*')]){n.__pgContrastStyle={color:n.style.getPropertyValue('color'),priority:n.style.getPropertyPriority('color'),shadow:n.style.getPropertyValue('text-shadow'),shadowPriority:n.style.getPropertyPriority('text-shadow')};n.style.setProperty('color','transparent','important');n.style.setProperty('text-shadow','none','important');for(const c of n.childNodes)if(c.nodeType===3&&c.textContent){texts.push([c,c.textContent]);c.textContent='';}}el.__pgContrastTexts=texts;});
  let pixels;try{pixels=await sharp(await node.screenshot({animations:'disabled'})).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
  finally{await node.evaluate(el=>{for(const [c,text] of el.__pgContrastTexts||[])c.textContent=text;delete el.__pgContrastTexts;const box=el.__pgContrastBox;if(box){box.width?el.style.setProperty('width',box.width,box.widthPriority):el.style.removeProperty('width');box.height?el.style.setProperty('height',box.height,box.heightPriority):el.style.removeProperty('height');box.shadow?el.style.setProperty('box-shadow',box.shadow,box.shadowPriority):el.style.removeProperty('box-shadow');delete el.__pgContrastBox;}for(const n of [el,...el.querySelectorAll('*')]){const s=n.__pgContrastStyle;if(!s)continue;s.color?n.style.setProperty('color',s.color,s.priority):n.style.removeProperty('color');s.shadow?n.style.setProperty('text-shadow',s.shadow,s.shadowPriority):n.style.removeProperty('text-shadow');delete n.__pgContrastStyle;}}); }
  const {data,info:image}=pixels,inset=Math.min(Math.floor(Math.min(image.width,image.height)/4),Math.ceil(info.border+4));let ratio=Infinity;
  for(const [px,py]of [[.25,.5],[.5,.5],[.75,.5],[.5,.25],[.5,.75]]){
   const x=Math.max(inset,Math.min(image.width-inset-1,Math.floor(image.width*px))),y=Math.max(inset,Math.min(image.height-inset-1,Math.floor(image.height*py))),offset=(y*image.width+x)*image.channels,background=[data[offset],data[offset+1],data[offset+2]];
   for(const foreground of info.colors)ratio=Math.min(ratio,contrastRatio(composite(parseColor(foreground.color),background,foreground.opacity),background));
  }
  results.push({...info,ratio});
 }
 return results;
}
module.exports={parseColor,composite,luminance,contrastRatio,opaqueBackground,renderedLabelContrast};
