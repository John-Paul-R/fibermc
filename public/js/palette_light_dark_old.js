function swapPalette() {
    root = document.documentElement;
    cPalette = root.style.getPropertyValue('--current-palette');
    console.log(cPalette);
    console.log("test");
    
    if (cPalette == 0) {
        root.style.setProperty('--color-base', '#252525');
        root.style.setProperty('--color-background', '#353535');
        root.style.setProperty('--color-element-1', '#ff0000');
        root.style.setProperty('--color-accent-1', '#af0404');
        root.style.setProperty('--color-accent-2', '#888888');
        root.style.setProperty('--color-inverse', '#f0f0f0');
        root.style.setProperty('--color-text', '#f0f0f0');
        root.style.setProperty('--color-text-inverse', '#414141');
        root.style.setProperty('--current-palette', 1);
        document.getElementById("settings").textContent = "Light Mode"
    } else if (cPalette == 1) {
        root.style.setProperty('--color-base', '#fafafa');
        root.style.setProperty('--color-background', '#f0f0f0');
        root.style.setProperty('--color-element-1', '#e0e0e0');
        root.style.setProperty('--color-accent-1', '#aaaaaa');
        root.style.setProperty('--color-accent-2', '#888888');
        root.style.setProperty('--color-inverse', '#333333');
        root.style.setProperty('--color-text', '#454545');
        root.style.setProperty('--color-text-inverse', '#d0d0d0');
        root.style.setProperty('--current-palette', 0);
        document.getElementById("settings").textContent = "Dark Mode"
    }
}