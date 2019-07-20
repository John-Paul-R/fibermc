(function() {
    document.onmousemove = animInvSqHover;

    function animInvSqHover(event) {
        var x = event.clientX;
        var y = event.clientY;
        elements = document.getElementsByClassName("category card");
        const height = 300;
        const width = 300;
        Array.prototype.forEach.call(elements, element => {
            var cHeight = element.style.getPropertyValue('height');
            var cWidth = element.style.getPropertyValue('width');
            var rect = element.getBoundingClientRect();
            var cx = rect.left+rect.width/2;
            var cy = rect.top+rect.height/2;
            console.log(cx+" "+cy);
            var dy = cy-y;
            var dx = cx-x;
            var dist = Math.sqrt(dy*dy+dx*dx)
            var coeff = 2/Math.log10(dist+6)
            element.style.setProperty('height', height*coeff+"px")
            element.style.setProperty('width', width*coeff+"px")

        });
    }
})();