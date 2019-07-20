(function () {
    'use strict';

    function animHoverEnter(event) {
        console.log("hoverEnter");
        TweenMax.to(event.target, .25, { scale:1.05 });
    }
    function animHoverLeave(event) {
        console.log("hoverLeave");
        TweenMax.to(event.target, .25, { scale:1 });
    }
    (function () {
        var elements = document.getElementsByClassName("category card");
        Array.prototype.forEach.call(elements, function (element) {
            element.addEventListener("mouseenter", animHoverEnter);
            element.addEventListener("mouseleave", animHoverLeave);
        });
        
    })();

}());
