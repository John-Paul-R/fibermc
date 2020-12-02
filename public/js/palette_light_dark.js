
var buttonElements;
var paletteIndex;
const STORAGE_KEY = 'selectedPaletteIndex';

/*! Shade/blend hex colors (for more info, see: https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js) )*/
const pSBCr=(d)=>{
    let i=parseInt,m=Math.round;
    let n=d.length,x={};
    if(n>9){
        [r,g,b,a]=d=d.split(","),n=d.length;
        if(n<3||n>4)return null;
        x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1
    }else{
        if(n==8||n==6||n<4)return null;
        if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
        d=i(d.slice(1),16);
        if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=m((d&255)/0.255)/1000;
        else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
    }return x};
const pSBC=(p,c0,c1,l)=>{
    let r,g,b,P,f,t,h,i=parseInt,m=Math.round,a=typeof(c1)=="string";
    if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
    
    h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=pSBCr(c0),P=p<0,t=c1&&c1!="c"?pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
    if(!f||!t)return null;
    if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
    else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
    a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
    if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
    else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
}
const RGB_Log_Shade=(p,c)=>{
	var i=parseInt,r=Math.round,[a,b,c,d]=c.split(","),P=p<0,t=P?0:p*255**2,P=P?1+p:1-p;
	return"rgb"+(d?"a(":"(")+r((P*i(a[3]=="a"?a.slice(5):a.slice(4))**2+t)**0.5)+","+r((P*i(b)**2+t)**0.5)+","+r((P*i(c)**2+t)**0.5)+(d?","+d:")");
}
const brightness=(c)=>{
    let f = pSBCr(c);
    return Math.max(f.r, f.g, f.b)/255;
}
const colorVariants=(c, varientPercent=0.15)=>{
    const out = [];
    out.push(c);
    let lighter = pSBC(varientPercent, c, false, true);
    let darker = pSBC(-1*varientPercent, c, false, true);
    if (brightness(c) < 0.5) {
        out.push(lighter);
        out.push(darker);
    } else {
        out.push(darker);
        out.push(lighter);
    }
    return out;
}

class BasePalette {
    constructor (paletteName, base, element1, accent1, accent2, text, textInverse) {
        this.paletteName = paletteName;
        this.base = base;
        this.element1 = element1;
        this.element1_1 = pSBC(0.15, element1, false, true);
        this.element1_2 = pSBC(-0.15, element1, false, true);

        this.accent1 = accent1;
        this.accent2 = accent2;
        this.text = text;
        this.textInverse = textInverse;
    }
}
class ColorPalette {
    constructor (basePalette) {
        this.paletteName = basePalette.paletteName;
        this.base = colorVariants(basePalette.base);

        this.background = basePalette.base;
        this.element1 = colorVariants(basePalette.element1);

        this.accent1 = colorVariants(basePalette.accent1);
        this.accent2 = colorVariants(basePalette.accent2, 0.2);
        this.text = colorVariants(basePalette.text);

        this.textInverse = basePalette.textInverse;
    }
}
var colorPalettes = [//Name     , base     , element-1, accent-1 , accent-2 , text     , text-inverse
    //  new ColorPalette('Light'   , '#fafafa', '#e0e0e0', '#aaaaaa', '#888888', '#353535', '#d0d0d0')
    new BasePalette('LYellow' , '#f6f4e6', '#a3d390', '#557836', '#41444b', '#000000', '#ffffff'),
    new BasePalette('Dark'    , '#252525', '#353637', '#af0404', '#888888', '#f0f0f0', '#414141'),
    new BasePalette('Color1'  , '#000000', '#14213d', '#fca311', '#e5e5e5', '#ffffff', '#000000'),
    new BasePalette('Color2'  , '#1a1a2e', '#16213e', '#e94560', '#0f3460', '#ffffff', '#000000'),
    new BasePalette('Color3'  , '#321f28', '#734046', '#e79e4f', '#a05344', '#ffffff', '#000000'),
    new BasePalette('Color4'  , '#eeeeee', '#686d76', '#19d3da', '#373a40', '#000000', '#ffffff'),
    new BasePalette('Color6'  , '#382933', '#3b5249', '#e94560', '#0f3460', '#ffffff', '#000000'),

]; //todo load this from external file? or from online library of available palettes?

function bindPaletteSwapButtons(btnElements) {
    if (!btnElements) {
        buttonElements = document.getElementsByClassName('swap_palette');
    } else {
        buttonElements = btnElements;
    }
    for (let i=0; i<buttonElements.length; i++) {
        buttonElements[i].addEventListener('click', swapPalette);
    }
}
bindPaletteSwapButtons();
loadStoredPalette();
var currentPalette;
function loadStoredPalette() {
    let stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
        paletteIndex = parseInt(stored, 10);
    } else {
        let mql = window.matchMedia('(prefers-color-scheme: dark)');
        if (mql.matches){
            paletteIndex = 1;
        } else {
            paletteIndex = 0;
        }
        
        window.localStorage.setItem(STORAGE_KEY, paletteIndex);
    }
    displayPalette(paletteIndex);
}
var changeFuncs = [];

function swapPalette() {
    paletteIndex +=1;
    if (paletteIndex >= colorPalettes.length) {
        paletteIndex = 0;
    }
    displayPalette(paletteIndex);
    window.localStorage.setItem(STORAGE_KEY, paletteIndex);
    for (const func of changeFuncs) {
        func(currentPalette);
    }
}
function onPaletteChange(func) {
    changeFuncs.push(func);
}
function displayPalette(paletteID) {
    const style = document.documentElement.style;
    let p = new ColorPalette(colorPalettes[paletteID]);
    style.setProperty('--color-base',           p.base[0]);
    style.setProperty('--color-base-1',         p.base[1]);
    style.setProperty('--color-base-2',         p.base[2]);
    style.setProperty('--color-background',     p.background);
    style.setProperty('--color-element-1',      p.element1[0]);
    style.setProperty('--color-element-1-1',    p.element1[1]);
    style.setProperty('--color-element-1-2',    p.element1[2]);
    style.setProperty('--color-accent-1',       p.accent1[0]);
    style.setProperty('--color-accent-1-1',     p.accent1[1]);
    style.setProperty('--color-accent-1-2',     p.accent1[2]);
    style.setProperty('--color-accent-2',       p.accent2[0]);
    style.setProperty('--color-accent-2-1',     p.accent2[1]);
    style.setProperty('--color-accent-2-2',     p.accent2[2]);
    style.setProperty('--color-inverse',        p.inverse);
    style.setProperty('--color-text',           p.text[0]);
    style.setProperty('--color-text-1',         p.text[1]);
    style.setProperty('--color-text-2',         p.text[2]);
    style.setProperty('--color-text-inverse',   p.textInverse);
    // for (let i=0; i<buttonElements.length; i++) {
    //     buttonElements[i].textContent = p.paletteName;
    // }
    currentPalette = p;
    return p;
}