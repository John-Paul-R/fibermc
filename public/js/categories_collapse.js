
(function() {
    const toggle_btn = document.getElementById("categories_list_toggle");
    const categories = document.getElementById("categories");
    toggle_btn.addEventListener('click', (e) => {
        categories.classList.toggle('open');
    });
})();
