import { effect } from "./effect";
import {
    updateUrlFromSearchOptions,
    getSearchOptionsFromState,
    searchTextChanged,
    selectCategories,
    getSearchOptionsFromUrl,
} from "./mod_search_logic";
import { Mod } from "./mod_types";
import { Signal } from "signal-polyfill";
import { CATEGORY_NAMES, MOD_DATA, TOTAL_MOD_COUNT } from "./search_page_state";

type CategoryElement = HTMLButtonElement & {
    bool_mode: number | undefined;
    cat_id: number;
    selected: boolean | undefined;
};

const isCategoryElement = (el: any): el is CategoryElement =>
    el.cat_id !== undefined;

type Category = {
    htmlElement: CategoryElement;
    name: string;
};

type CategoryWithCounts = Category & {
    renderCount: () => void;
    modCount: number;
    filteredModCount: number | null;
}


var categories_sidebar_elem: HTMLElement;
let initialized = false;
export function initCategoriesSidebar() {
    if (initialized) {
        return;
    }
    initialized = true;
    const categories = CATEGORIES.get();
    //TODO Group "Selected" items?
    //TODO "select multiple" toggle
    //TODO Option to sort categories by name or by num mods in category
    //TODO Display "searching in these categories" under searchbar. With option to click them to remove.
    const getCategoriesSidebarElem = () => {
        const elem = document.getElementById("categories_list");
        if (!elem) {
            throw new Error(
                "Could not find 'categories_sidebar_elem' (Element Id: 'categories_list')"
            );
        }
        return elem;
    };
    categories_sidebar_elem = getCategoriesSidebarElem();

    const createAllModsElement = () => {
        const elem = document.createElement("button") as CategoryElement;

        elem.classList.add("reset_button");
        elem.cat_id = -1;
        const title = "All mods (reset)";

        elem.textContent = title + " ";
        const mod_count = document.createElement("span");
        mod_count.textContent = MOD_DATA.get().length.toFixed(0);
        elem.appendChild(mod_count);
        elem.addEventListener("click", clearFilters);
        categories_sidebar_elem.appendChild(elem);

        elem.classList.add("reset_categories_button");

        effect(() => {
            console.log("MODS COUNT EFFECT",                 MOD_DATA.get().length,
            TOTAL_MOD_COUNT.get()
)
            mod_count.textContent = buildCategoryCountStr(
                MOD_DATA.get().length,
                TOTAL_MOD_COUNT.get()
            );
        })
    };
    createAllModsElement();

    {
        // Init CATEGORIES

        effect(() => {
            const categories = CATEGORIES.get();
            for (const category of categories) {
                category.modCount = 0;
            }
            // Mod Counts
            for (const mod of MOD_DATA.get()) {
                for (const cat_id of mod.categories) {
                    categories[cat_id].modCount += 1;
                }
            }
            updateCategoryModCounts(MOD_DATA.get());
        })
    }

    for (let i = 0; i < categories.length; i++) {
        if (categories[i].name.toUpperCase() === "FABRIC") {
            fabric_category_id = i;
            break;
        }
    }
    // TODO Restructure this, jfc
    for (let i = 0; i < categories.length; i++) {}
    const sorted_CATEGORIES = categories.slice().sort(function (a, b) {
        return b.modCount - a.modCount;
    });
    for (let i = 0; i < sorted_CATEGORIES.length; i++) {
        const category = sorted_CATEGORIES[i];
        if (category.modCount === 0) {
            continue;
        }
        const cat_elem = category.htmlElement;
        cat_elem.selected = false;
        applyCategorySelection(cat_elem);
        cat_elem.addEventListener("click", onClick);
        categories_sidebar_elem.appendChild(cat_elem);
    }

    effect(() => {
        // sort the category elements by mod count
        MOD_DATA.get(); // needed to force this to react to that signal
        const sorted_CATEGORIES = CATEGORIES.get().slice().sort(function (a, b) {
            return b.modCount - a.modCount;
        });
        console.log("REORDER", sorted_CATEGORIES)
        for (let i = 0; i < sorted_CATEGORIES.length; i++) {
            // appending an item that already exists in the dom moves it
            categories_sidebar_elem.append(sorted_CATEGORIES[i].htmlElement)
        }
    })

    // 0=none, 1=AND, 2=NOT | OR??
    const NUM_BOOL_OPS = 2;
    function onClick(e: Event) {
        const cat_elem = e.target;
        if (!isCategoryElement(cat_elem)) {
            throw new Error(
                "Category click listener was applied to an element without CategoryElement metadata."
            );
        }
        const bool_mode = cat_elem.bool_mode ?? BoolMode.None;
        cat_elem.bool_mode =
            bool_mode < NUM_BOOL_OPS ? bool_mode + 1 : BoolMode.None;
        applyCategorySelection(cat_elem);
        updateUrlFromSearchOptions(getSearchOptionsFromState());
        searchTextChanged(undefined, true);
    }
    function clearFilters() {
        for (const cat of categories) {
            const cat_elem = cat.htmlElement;
            cat_elem.classList.remove("and");
            cat_elem.classList.remove("not");
            cat_elem.bool_mode = BoolMode.None;
        }
        applyCategorySelections();
        updateUrlFromSearchOptions(getSearchOptionsFromState());
        searchTextChanged(undefined, true);
    }
    selectCategories(getSearchOptionsFromUrl());
}
export enum BoolMode {
    None = 0,
    And = 1,
    Not = 2,
}
export var fabric_category_id: number;
export function applyCategorySelection(cat_elem: CategoryElement) {
    if (cat_elem.bool_mode == BoolMode.And) {
        cat_elem.classList.add("and");
    } else {
        cat_elem.classList.remove("and"); //.border = '2px solid var(--color-element-1)';
    }
    if (cat_elem.bool_mode == BoolMode.Not) {
        cat_elem.classList.add("not");
    } else {
        cat_elem.classList.remove("not"); //.border = '2px solid var(--color-element-1)';
    }
}

export function applyCategorySelections() {
    effect(() => {
        CATEGORIES.get()
            .map((cat) => cat.htmlElement)
            .forEach(applyCategorySelection);
    })
}

function buildCategoryCountStr(
    totalModCount: number,
    filteredModCount: number | null
) {
    return filteredModCount !== null
        ? `${filteredModCount} / ${totalModCount}`
        : totalModCount.toString();
};

export function getSelectedCategoryIds() {
    const selected_cat_ids: {
        and: number[];
        not: number[];
    } = {
        and: [],
        not: [],
    };

    for (const category of CATEGORIES.get()) {
        const cat_elem = category.htmlElement;
        if (cat_elem.bool_mode == 1) {
            selected_cat_ids.and.push(cat_elem.cat_id);
        } else if (cat_elem.bool_mode == 2) {
            selected_cat_ids.not.push(cat_elem.cat_id);
        }
    }
    return selected_cat_ids;
}

export function updateCategoryModCounts(mods: Mod[]) {
    const categories = CATEGORIES.get();
    const selectedCategories = getSelectedCategoryIds();
    const isFiltering =
        MOD_DATA.get().length !== mods.length ||
        selectedCategories.and.length > 0 ||
        selectedCategories.not.length > 0;
    if (isFiltering) {
        for (const category of categories) {
            category.filteredModCount = 0;
        }
        // Mod Counts
        for (const mod of mods) {
            for (const cat_id of mod.categories) {
                categories[cat_id].filteredModCount! += 1;
            }
        }
    } else {
        for (const category of categories) {
            category.filteredModCount = null;
        }
    }

    TOTAL_MOD_COUNT.set(isFiltering ? mods.length : null);
    for (const category of categories) {
        category.renderCount();
    }
}


const createCategoryElement = (categoryId: number): CategoryElement => {
    const cat_elem = document.createElement("button") as CategoryElement;
    cat_elem.classList.add("reset_button");
    cat_elem.cat_id = categoryId; //category.categoryId;
    return cat_elem;
};

export const CATEGORIES = new Signal.Computed<CategoryWithCounts[]>(() =>
    CATEGORY_NAMES.get().map((name, idx) => {
        const categoryElement = createCategoryElement(idx);
        const countElement = document.createElement("span");
        categoryElement.textContent = name + " ";
        categoryElement.appendChild(countElement);

        return {
            name: name,
            modCount: 0,
            filteredModCount: null,
            renderCount() {
                countElement.textContent = buildCategoryCountStr(
                    this.modCount,
                    this.filteredModCount
                );
            },
            htmlElement: categoryElement,
        };
    })
);
