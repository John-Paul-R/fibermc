
(function() {
    const toggle_btn = document.getElementById("cat_head");
    const categories = document.getElementById("categories");
    toggle_btn.addEventListener('click', (e) => {
        categories.classList.toggle('open');
    });
})();
