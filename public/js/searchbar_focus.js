function searchbarFocus(val) {
    parent = event.target.parentElement
    newOpacity = 1;
    if (val == 'in') {
        parent.style.getPropertyValue('--default-scale');
        TweenMax.to(parent, .25, { scale:1.1 });
    } else {
        if (event.target.parentElement.querySelector(".searchField").value == "") {
            newOpacity = 0.6
            TweenMax.to(parent, .25, { scale:1 });
        }

    }
    parent.style.setProperty('opacity', newOpacity);
}