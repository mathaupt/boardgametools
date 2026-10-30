// Runs inside the browser; composites translucent backgrounds before checking WCAG contrast.
export function primaryButtonContrast() {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d");
  const rgba = (color) => { context.clearRect(0,0,1,1); context.fillStyle=color; context.fillRect(0,0,1,1); return Array.from(context.getImageData(0,0,1,1).data).map((v,i)=>i===3?v/255:v); };
  const composite = (front, back) => front.slice(0,3).map((v,i)=>v*front[3]+back[i]*(1-front[3])).concat(1);
  const luminance = (rgb) => rgb.slice(0,3).map(v=>{ const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4; }).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  return Array.from(document.querySelectorAll('[data-slot="button"][data-variant="default"]')).map(button=>{
    const parents=[]; for(let node=button;node;node=node.parentElement) parents.unshift(node);
    const background=parents.reduce((back,node)=>composite(rgba(getComputedStyle(node).backgroundColor),back),[255,255,255,1]);
    const foreground=composite(rgba(getComputedStyle(button).color),background);
    const a=luminance(foreground),b=luminance(background);
    return {text:button.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  });
}
