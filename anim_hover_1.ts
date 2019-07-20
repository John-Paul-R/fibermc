import { TweenMax } from "gsap";

(function() {
    var elements = document.getElementsByClassName("category element");
    Array.prototype.forEach.call(elements, (element: Element) => {
        element.addEventListener("mouseenter", animHoverEnter)
        element.addEventListener("mouseleave", animHoverLeave)

    });

    function animHoverEnter(event: Event) {
        TweenMax.to(event.target, .5, {height:400, width:400});

    }
    function animHoverLeave(event: Event) {
        TweenMax.to(event.target, .5, {height:300, width:300});
        
    }
})();