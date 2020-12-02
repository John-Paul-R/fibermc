(function() {
    var searchbars = document.getElementsByClassName('searchbar');;
    //bindSearchbarFocus
    for (let i=0; i<searchbars.length; i++) {
        searchbars[i].addEventListener('focusin', (e)=>searchbarFocus(e, 'in'));
        searchbars[i].addEventListener('focusout', (e)=>searchbarFocus(e, 'out'));
        searchbars[i].addEventListener("mouseenter", searchbarMouseEnter );
        searchbars[i].addEventListener("mouseleave", searchbarMouseLeave );
    }
    
    function searchbarFocus(e, val) {
        let parent = e.target.parentElement;
        let newOpacity = 1;
        if (val == 'in') {
            gsap.to(parent, .15, { opacity: newOpacity });
            parent.style.setProperty("box-shadow", "var(--shadow)");
            // parent.style.setProperty("border", "1px var(--color-base) solid");
        } else {
            if (!parent.isHovered && (true || e.target.parentElement.querySelector(".searchField").value == "")) {
                newOpacity = 0.8
                //var default_scale = parseInt(parent.style.getPropertyValue('--default-scale'));
                gsap.to(parent, .15, { opacity: newOpacity});
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
        gsap.to(target, .15, { opacity: newOpacity });
        target.style.setProperty("box-shadow", "var(--shadow)");
    }
    function searchbarMouseLeave(e) {
        let target = e.target;
        let newOpacity = 1;
        target.isHovered = false;
        if (!e.target.contains(document.activeElement) && (true || e.target.parentElement.querySelector(".searchField").value == "")) {
            newOpacity = 0.8
            //var default_scale = parseInt(parent.style.getPropertyValue('--default-scale'));
            gsap.to(target, .15, { opacity: newOpacity});
            target.style.setProperty("box-shadow", "none");
            // target.style.setProperty("border", "1px var(--color-element-1) solid");
        }
    }
    
})();
