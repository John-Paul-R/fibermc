
const cat_layout_btn = document.getElementById("cat_layout_btn");
const categories_elem = document.getElementById("categories");

const STORAGE_KEY = 'cat_layout_mode';
const modes = ['view_list', 'view_quilt']
let storedMode = window.localStorage.getItem(STORAGE_KEY);
// if no stored mode, init default
if (storedMode === null) {
    window.localStorage.setItem(STORAGE_KEY, modes[0]);
    storedMode = modes[0]
}
// Init display based on stored setting

if (storedMode === modes[0]) {
    categories_elem.classList.add('view_list');
} else if ((storedMode === modes[1])) {
    categories_elem.classList.remove('view_list');
} else {
    throw new Error("This should not be possible. Good luck.");
}


cat_layout_btn.addEventListener('click', (e) => {
    categories_elem.classList.toggle('view_list');
    
    if (categories_elem.classList.contains('view_list')) {
        window.localStorage.setItem(STORAGE_KEY, modes[0]);
    } else {
        window.localStorage.setItem(STORAGE_KEY, modes[1]);
    }
});
