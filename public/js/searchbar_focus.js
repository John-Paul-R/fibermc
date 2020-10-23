bindSearchbarFocus();

var searchbars; 
function bindSearchbarFocus(searchbarElements) {
    if (!searchbarElements) {
        searchbars = document.getElementsByClassName('searchbar');
    }
    for (let i=0; i<searchbars.length; i++) {
        searchbars[i].addEventListener('focusin', ()=>searchbarFocus('in'));
        searchbars[i].addEventListener('focusout', ()=>searchbarFocus('out'));
        searchbars[i].addEventListener("mouseenter", searchbarMouseEnter );
        searchbars[i].addEventListener("mouseleave", searchbarMouseLeave );
    }
}

function searchbarFocus(val) {
    let parent = event.target.parentElement;
    let newOpacity = 1;
    if (val == 'in') {
        gsap.to(parent, .15, { scale:1, opacity: newOpacity });
        parent.style.setProperty("box-shadow", "var(--shadow)");
        // parent.style.setProperty("border", "1px var(--color-base) solid");
    } else {
        if (!parent.isHovered && (true || event.target.parentElement.querySelector(".searchField").value == "")) {
            newOpacity = 0.8
            //var default_scale = parseInt(parent.style.getPropertyValue('--default-scale'));
            gsap.to(parent, .15, { scale: .99, opacity: newOpacity});
            parent.style.setProperty("box-shadow", "none");
            // parent.style.setProperty("border", "1px var(--color-element-1) solid");
        }

    }
    //parent.style.setProperty('opacity', newOpacity);
}

function searchbarMouseEnter(e) {
    let target = e.target;
    let newOpacity = 1;
    target.isHovered = true;
    gsap.to(target, .15, { scale:1, opacity: newOpacity });
        target.style.setProperty("box-shadow", "var(--shadow)");
}
function searchbarMouseLeave(e) {
    let target = e.target;
    let newOpacity = 1;
    target.isHovered = false;
    if (!e.target.contains(document.activeElement) && (true || event.target.parentElement.querySelector(".searchField").value == "")) {
        newOpacity = 0.8
        //var default_scale = parseInt(parent.style.getPropertyValue('--default-scale'));
        gsap.to(target, .15, { scale: .99, opacity: newOpacity});
        target.style.setProperty("box-shadow", "none");
        // target.style.setProperty("border", "1px var(--color-element-1) solid");
    }
}
