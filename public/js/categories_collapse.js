
(function () {
    const toggle_btn = document.getElementById("cat_head");
    const categories = document.getElementById("categories");
    let isMobileQuery = window.matchMedia("(max-width: 1162px)");
    let isMobile = isMobileQuery.matches;
    const changeHandler = (e) => {
        isMobile = e.matches;
    };
    if (isMobileQuery.addEventListener) {
        isMobileQuery.addEventListener('change', changeHandler);
    } else if (isMobileQuery.addListener) {
        // Safari bad
        isMobileQuery.addListener((list, event) => changeHandler(event))
    }

    toggle_btn.addEventListener('click', (e) => {
        if (isMobile)
            categories.classList.toggle('open');
    });
})();
