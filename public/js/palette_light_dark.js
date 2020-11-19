(function() {
    var buttonElements;
    var paletteIndex;
    const STORAGE_KEY = 'selectedPaletteIndex';

    /*! Shade/blend hex colors (for more info, see: https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js) )*/
    const pSBC=(p,c0,c1,l)=>{
        let r,g,b,P,f,t,h,i=parseInt,m=Math.round,a=typeof(c1)=="string";
        if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
        if(!this.pSBCr)this.pSBCr=(d)=>{
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
        h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=this.pSBCr(c0),P=p<0,t=c1&&c1!="c"?this.pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
        if(!f||!t)return null;
        if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
        else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
        a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
        if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
        else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
    }
    class ColorPalette {
        constructor (paletteName, base, element1, accent1, accent2, text, textInverse) {
            const variantPercent = 0.20;
            this.paletteName = paletteName;
            this.base = base;
            this.background = base;
            // this.background = background;
            this.element1 = element1;
            this.element1_1 = pSBC(0.15, element1, false, true);
            this.element1_2 = pSBC(-0.15, element1, false, true);


            this.accent1 = accent1;
            this.accent1_1 = pSBC(variantPercent, accent1, false, true);
            this.accent2 = accent2;
            this.accent2_1 = pSBC(variantPercent, accent2, false, true);

            // this.inverse = inverse;
            this.text = text;
            this.textInverse = textInverse;
        }
    }
    var colorPalettes = [//Name     , base     , element-1, accent-1 , accent-2 , text     , text-inverse
        new ColorPalette('Light'    , '#fafafa', '#e0e0e0', '#aaaaaa', '#888888', '#353535', '#d0d0d0')
        ,new ColorPalette('Dark'    , '#252525', '#353637', '#af0404', '#888888', '#f0f0f0', '#414141')
        ,new ColorPalette('Color1'  , '#000000', '#14213d', '#fca311', '#e5e5e5', '#ffffff', '#000000')
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
    function loadStoredPalette() {
        let stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
            paletteIndex = parseInt(stored, 10);
        } else {
            let mql = window.matchMedia('(prefers-color-scheme: dark)');
            if (mql.matches){
                console.log("prefers-color-scheme = dark. Using dark theme.")
                paletteIndex = 1;
            } else {
                console.log("prefers-color-scheme != dark. Using light theme.")
                paletteIndex = 0;
            }
            
            window.localStorage.setItem(STORAGE_KEY, paletteIndex);
        }
        displayPalette(paletteIndex);
    }
    
    function swapPalette() {
        paletteIndex +=1;
        if (paletteIndex >= colorPalettes.length) {
            paletteIndex = 0;
        }
        displayPalette(paletteIndex);
        window.localStorage.setItem(STORAGE_KEY, paletteIndex);
    }
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        f= result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
        return f.r+","+f.g+","+f.b;
    }
    function displayPalette(paletteID) {
        const style = document.documentElement.style;
        let p = colorPalettes[paletteID];
        style.setProperty('--color-base',           p.base);
        style.setProperty('--color-background',     p.background);
        style.setProperty('--color-element-1',      p.element1);
        style.setProperty('--color-element-1-1',    p.element1_1);
        style.setProperty('--color-element-1-2',    p.element1_2);
        style.setProperty('--color-accent-1',       p.accent1);
        style.setProperty('--color-accent-1-1',     p.accent1_1);
        style.setProperty('--color-accent-2',       p.accent2);
        style.setProperty('--color-accent-2-1',     p.accent2_1);
        style.setProperty('--color-inverse',        p.inverse);
        style.setProperty('--color-text',           p.text);
        style.setProperty('--color-text-rgb',       hexToRgb(p.text));
        style.setProperty('--color-text-inverse',   p.textInverse);
        // for (let i=0; i<buttonElements.length; i++) {
        //     buttonElements[i].textContent = p.paletteName;
        // }
    }
})();