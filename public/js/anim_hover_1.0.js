(function () {
    'use strict';

    const default_scale = 0.97;

    function animHoverEnter(event) {
        //TweenMax.to(event.target, .15, { scale:1.05 });
        TweenMax.to(event.target, .15, { scale:1 });
    }
    function animHoverLeave(event) {
        //TweenMax.to(event.target, .15, { scale:1 });
        TweenMax.to(event.target, .15, { scale: default_scale });
    }
    (function () {
        var elements = document.getElementsByClassName("category card");
        Array.prototype.forEach.call(elements, function (element) {
            element.addEventListener("mouseenter", animHoverEnter);
            element.addEventListener("mouseleave", animHoverLeave);
            TweenMax.to(element, 0.05, {scale: default_scale})
        });
    })();

}());
