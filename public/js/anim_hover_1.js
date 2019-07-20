"use strict";
exports.__esModule = true;
var gsap_1 = require("gsap");
(function () {
    var elements = document.getElementsByClassName("category element");
    Array.prototype.forEach.call(elements, function (element) {
        element.addEventListener("mouseenter", animHoverEnter);
        element.addEventListener("mouseleave", animHoverLeave);
    });
    function animHoverEnter(event) {
        gsap_1.TweenMax.to(event.target, .5, { scale:1.2 });
    }
    function animHoverLeave(event) {
        gsap_1.TweenMax.to(event.target, .5, { scale:0.833333333333333 });
    }
})();
//# sourceMappingURL=anim_hover_1.js.map