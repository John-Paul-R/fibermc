import { effect } from "./effect";
import {
    updateUrlFromSearchOptions,
    getSearchOptionsFromState,
    searchTextChanged,
    getSearchOptionsFromUrl,
    SearchOptions,
} from "./mod_search_logic";
import { Mod } from "./mod_types";
import { Signal } from "signal-polyfill";
import { MOD_DATA, TOTAL_MOD_COUNT } from "./search_page_state";

type CategoryElement = HTMLButtonElement & {
    bool_mode: number | undefined;
    cat_id: number;
    selected: boolean | undefined;
};

const isCategoryElement = (el: any): el is CategoryElement =>
    el.cat_id !== undefined;


var categories_sidebar_elem: HTMLElement;
let initialized = false;
export function initCategoriesSidebar() {
    if (initialized) {
        return;
    }
    initialized = true;
    const categories = CATEGORIES.ELEMENTS;
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
            console.log(
                "MODS COUNT EFFECT",
                MOD_DATA.get().length,
                TOTAL_MOD_COUNT.get()
            );
            mod_count.textContent = buildCategoryCountStr(
                MOD_DATA.get().length,
                TOTAL_MOD_COUNT.get()
            );
        });
    };
    createAllModsElement();

    {
        // Init CATEGORIES
        effect(() => {
            // Mod Counts
            const categories = CATEGORIES.BY_ID;
            const totalModCountsByCatId = countModsByCategoryId(MOD_DATA.get());
            console.log("INITIAL COUNTS", totalModCountsByCatId, MOD_DATA.get())
            for (const category of categories) {
                category.setTotalModCount(
                    totalModCountsByCatId[category.id]?.count ?? 0
                );
            }

            updateFilteredCategoryModCounts(MOD_DATA.get());
        });
    }

    effect(() => {
        const categoryNames = CATEGORIES.NAMES.get();
        for (let i = 0; i < categoryNames.length; i++) {
            if (categoryNames[i].toUpperCase() === "FABRIC") {
                fabric_category_id = i;
                break;
            }
        }
    });


    effect(() => {
        // sort the category elements by mod count
        MOD_DATA.get(); // needed to force this to react to that signal
        const sorted_CATEGORIES = CATEGORIES.BY_ID.slice().sort(function (
            a,
            b
        ) {
            return b.totalModCount - a.totalModCount;
        });
        console.log("REORDER", sorted_CATEGORIES);
        for (let i = 0; i < sorted_CATEGORIES.length; i++) {
            // appending an item that already exists in the dom moves it
            categories_sidebar_elem.append(sorted_CATEGORIES[i].element);
        }
    });

    function clearFilters() {
        for (const cat of Object.values(categories)) {
            cat.setBoolMode(BoolMode.None);
        }
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

function selectCategories({
    categoryIncludes,
    categoryExcludes,
}: SearchOptions): void {
    const categories = CATEGORIES.ELEMENTS;
    categoryIncludes?.forEach((catName) => {
        categories[catName]!.setBoolMode(BoolMode.And);
    });
    categoryExcludes?.forEach((catName) => {
        categories[catName]!.setBoolMode(BoolMode.Not);
    });
}

function buildCategoryCountStr(
    totalModCount: number,
    filteredModCount: number | null
) {
    return filteredModCount !== null
        ? `${filteredModCount} / ${totalModCount}`
        : totalModCount.toString();
}

export function getSelectedCategoryIds() {
    const selected_cat_ids: {
        and: number[];
        not: number[];
    } = {
        and: [],
        not: [],
    };

    for (const category of Object.values(CATEGORIES.ELEMENTS)) {
        const bool_mode = category.boolMode;
        if (bool_mode === BoolMode.And) {
            selected_cat_ids.and.push(category.id);
        } else if (bool_mode === BoolMode.Not) {
            selected_cat_ids.not.push(category.id);
        }
    }
    return selected_cat_ids;
}

export function updateFilteredCategoryModCounts(mods: Mod[]) {
    const categories = CATEGORIES.BY_ID;
    const selectedCategories = getSelectedCategoryIds();
    const isFiltering =
        MOD_DATA.get().length !== mods.length ||
        selectedCategories.and.length > 0 ||
        selectedCategories.not.length > 0;
    if (isFiltering) {
        // Mod Counts
        const filteredModCountsById = countModsByCategoryId(mods);

        for (const category of categories) {
            category.setFilteredModCount(
                filteredModCountsById[category.id]?.count ?? null
            );
        }
    } else {
        for (const category of categories) {
            category.setFilteredModCount(null);
        }
    }

    TOTAL_MOD_COUNT.set(isFiltering ? mods.length : null);
}

const createCategoryElement = (categoryId: number): CategoryElement => {
    const cat_elem = document.createElement("button") as CategoryElement;
    cat_elem.classList.add("reset_button");
    cat_elem.cat_id = categoryId; //category.categoryId;
    return cat_elem;
};

export class CategoryEl {
    private _id: number;
    private _name: string;
    private _element: CategoryElement;
    private _countElement: HTMLSpanElement;
    private _totalModCount: number;
    private _filteredModCount: number | null;
    constructor(name: string, idx: number) {
        this._id = idx;
        this._name = name;
        this._element = createCategoryElement(idx);
        this._countElement = document.createElement("span");
        this._element.textContent = name + " ";
        this._element.appendChild(this._countElement);
        this._totalModCount = 0;
        this._filteredModCount = null;

        this._element.selected = false;
        // applyCategorySelection(cat_elem);

        // 0=none, 1=AND, 2=NOT | OR??
        const NUM_BOOL_OPS = 2;
        this._element.addEventListener("click", (e: Event) => {
            const cat_elem = e.target;
            if (!isCategoryElement(cat_elem)) {
                throw new Error(
                    "Category click listener was applied to an element without CategoryElement metadata."
                );
            }
            const bool_mode = cat_elem.bool_mode ?? BoolMode.None;
            this.setBoolMode(
                bool_mode < NUM_BOOL_OPS ? bool_mode + 1 : BoolMode.None
            );
            updateUrlFromSearchOptions(getSearchOptionsFromState());
            searchTextChanged(undefined, true);
        });
    }

    private renderModCounts(
        totalModCount: number,
        filteredModCount: number | null
    ) {
        this._countElement.textContent = buildCategoryCountStr(
            totalModCount,
            filteredModCount
        );
    }

    get boolMode(): BoolMode {
        return this._element.bool_mode ?? BoolMode.None;
    }
    setBoolMode(mode: BoolMode) {
        this._element.bool_mode = mode;
        this.applyCategorySelection();
    }

    isSelected(): boolean {
        return !!this._element.selected;
    }

    private applyCategorySelection() {
        if (this._element.bool_mode == BoolMode.And) {
            this._element.classList.add("and");
        } else {
            this._element.classList.remove("and"); //.border = '2px solid var(--color-element-1)';
        }
        if (this._element.bool_mode == BoolMode.Not) {
            this._element.classList.add("not");
        } else {
            this._element.classList.remove("not"); //.border = '2px solid var(--color-element-1)';
        }
    }

    setFilteredModCount(count: number | null): void {
        this._filteredModCount = count;
        this.renderModCounts(this._totalModCount, this._filteredModCount);
    }

    setTotalModCount(count: number): void {
        this._totalModCount = count;
        this.renderModCounts(this._totalModCount, this._filteredModCount);
    }

    get id(): number {
        this.setFilteredModCount;
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get element(): HTMLButtonElement {
        return this._element;
    }

    get totalModCount(): number {
        return this._totalModCount;
    }
}

const _categories_by_id = new Signal.State<CategoryEl[]>([]);
const _categories_by_name = new Signal.State<Record<string, CategoryEl>>({});
export const CATEGORIES = {
    NAMES: new Signal.State<string[]>([]),
    get ELEMENTS(): Record<string, CategoryEl> {
        return _categories_by_name.get();
    },
    get BY_ID(): CategoryEl[] {
        return _categories_by_id.get();
    },
    setCategoryNames: function (categoryNames: string[]) {
        if (this.NAMES.get().length > 0) {
            this.NAMES.set(categoryNames);
            const byId = categoryNames.map(
                (name, idx) => new CategoryEl(name, idx)
            );
            _categories_by_id.set(byId);
            _categories_by_name.set(
                Object.fromEntries(byId.map((cat) => [cat.name, cat]))
            );
        }
    },
};

effect(() => {
    CATEGORIES.setCategoryNames(CATEGORIES.NAMES.get());
});

function countModsByCategoryId(mods: Mod[]): Record<number, { count: number } | undefined>{
    return mods.reduce(
        (accum, mod) => {
            for (const cat_id of mod.categories) {
                let catEntry = accum[cat_id];
                if  (catEntry === undefined) { 
                    catEntry = accum[cat_id] = { count: 0 };
                }
                catEntry.count += 1;
            }
            return accum;
        },
        {} as Record<number, { count: number } | undefined>
    );
}