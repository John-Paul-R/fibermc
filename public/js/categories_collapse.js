
(function() {
    const toggle_btn = document.getElementById("cat_head");
    const categories = document.getElementById("categories");
    let isMobileQuery = window.matchMedia("(max-width: 1162px)");
    let isMobile = isMobileQuery.matches;
    isMobileQuery.addEventListener('change', (e) => {
        isMobile = e.matches;
    });
    toggle_btn.addEventListener('click', (e) => {
        if (isMobile)
            categories.classList.toggle('open');
    });
})();
