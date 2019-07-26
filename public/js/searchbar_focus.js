function searchbarFocus(val) {
    parent = event.target.parentElement
    newOpacity = 1;
    if (val == 'in') {
        TweenMax.to(parent, .15, { scale:1, opacity: newOpacity });
        parent.style.setProperty("box-shadow", "var(--shadow)");
        parent.style.setProperty("border", "1px var(--color-base) solid");
    } else {
        if (event.target.parentElement.querySelector(".searchField").value == "") {
            newOpacity = 0.8
            //var default_scale = parseInt(parent.style.getPropertyValue('--default-scale'));
            TweenMax.to(parent, .15, { scale: .99, opacity: newOpacity});
            parent.style.setProperty("box-shadow", "none");
            parent.style.setProperty("border", "1px var(--color-element-1) solid");
        }

    }
    //parent.style.setProperty('opacity', newOpacity);
    
}