import { setHidden, getElementById } from "./util.js";
import { AsyncDataResourceLoader } from "./resource_loader.js";
import {
    getSortFunc,
    getSortState,
    registerListener as registerSortListener,
    setSortMode,
} from "./table_sort.js";
import { BaseMod, Mod, baseModToMod, versionOrd } from "./mod_types.js";
import { initMultiselectElement } from "./multiselect.js";

export {
    init,
    initSearch,
    initCategoriesSidebar,
    fabric_category_id,
    loader,
    mod_data,
    setModData,
    CATEGORIES,
    setCategories,
    resultsListElement,
    setResultsListElement,
    storeBatches,
    runBatches,
    resetBatches,
    pxAboveTop,
    pxBelowBottom,
    data_batches,
    batch_containers,
    last_contentful_container_idx,
    first_contentful_container_idx,
    LI_HEIGHT,
    BATCH_SIZE,
    setLiHeight,
};

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
    modCount: number;
};

//==============
// DATA LOADING
//==============
console.log("hostname", window.location.hostname);
const apiUrl = `https://${
    window.location.hostname === "localhost"
        ? "localhost:5001"
        : window.location.hostname
}/api/v1.0`;
// Load mod data from external file
var loader = new AsyncDataResourceLoader({
    completionWaitForDCL: true,
})
    .addResource<BaseMod[]>(`${apiUrl}/Mods`, [
        (jsonData) => {
            setModData(jsonData.map(baseModToMod));
            // Sort descending
            mod_data.sort((a, b) => b.downloadCount - a.downloadCount);
            console.log("mod_data", mod_data);
        },
    ])
    .addResource<string[]>(`${apiUrl}/Categories`, [
        (jsonData) => {
            categoryNames = jsonData;
            console.log("categoryNames", categoryNames);
        },
    ])
    .addCompletionFunc(initCategoriesSidebar);
var timestamp: string;
var currentSelectedVersions: [string, number][] = [];
function init() {
    loader
        .addCompletionFunc(() => {
            defaultSearchInput.value = getUrlSearchValue() ?? "";
            searchTextChanged(getUrlSearchValue());
            console.log("mod_data loaded. Running search from query params.");
        })
        .addCompletionFunc(() =>
            updateTimestamp(
                new Date(
                    mod_data
                        .map((mod) => mod.s_dateModified)
                        .reduce((accum, current) => Math.max(accum, current), 0)
                )
            )
        )
        .addCompletionFunc(() => {
            const searchOptions = getSearchOptionsFromUrl();
            setSortMode({
                sortField: searchOptions.sortField,
                sortDirection: searchOptions.sortDirection,
            });
            currentSelectedVersions =
                searchOptions.versions?.map(
                    (str) => [str, versionOrd(str)] as [string, number]
                ) ?? [];
            console.log(searchOptions, currentSelectedVersions);
            searchTextChanged(undefined);
            registerSortListener(({ sortMode: sortField, sortDirection }) => {
                updateUrlFromSearchOptions({
                    ...getSearchOptionsFromState(),
                    sortField,
                    sortDirection,
                });
            });
        })
        .addCompletionFunc(() => {
            const versionNums = new Set<number>();
            const versions: [string, number][] = [];
            for (let i = 0; i < mod_data.length; i++) {
                const m = mod_data[i];
                if (!versionNums.has(m.s_latestMCVersion)) {
                    versions.push([m.latestMCVersion, m.s_latestMCVersion]);
                }
                versionNums.add(m.s_latestMCVersion);
            }

            versions.sort((a, b) => b[1] - a[1]); // descending
            // var options = ["option a", "option b", "option c"];
            getSearchOptionsFromUrl().versions;

            const showSnapshotsLabel = document.createElement('label');
            showSnapshotsLabel.textContent = "show snapshots"
            showSnapshotsLabel.classList.add('button');
            const showSnapshotsCheckbox = document.createElement('input');
            showSnapshotsCheckbox.type = 'checkbox';
            showSnapshotsCheckbox.id = "snapshot_toggle";
            const getSnapshotsLabel = () => {
                showSnapshotsLabel.textContent = "show snapshots"
                showSnapshotsLabel.appendChild(showSnapshotsCheckbox);
                return showSnapshotsLabel;
            };

            const setSelectedVersions = (newVersions: [string, number][]) => {
                currentSelectedVersions = newVersions;
                searchTextChanged(undefined, true);
                updateUrlFromSearchOptions({
                    ...getSearchOptionsFromState(),
                });

                console.log(currentSelectedVersions);
            };
            const initVersionsMultiselect = (versionsForMultiselect: [string, number][]) => {
                initMultiselectElement({
                    rootElement: getElementById("version_multiselect"),
                    options: versionsForMultiselect,
                    setSelectedValues: (setter) => {
                        setSelectedVersions(setter(currentSelectedVersions))
                    },
                    currentValues: currentSelectedVersions,
                    renderValue: (val) => val[0],
                    key: (val) => val[1], // gets the version in num form,
                    leadingChildren: [getSnapshotsLabel()]
                });
            }
            const snapshotRegex = /[a-z]/i;
            initVersionsMultiselect(versions.filter(v => !snapshotRegex.test(v[0])));

            showSnapshotsCheckbox.addEventListener('change', (e) => {
                const shouldShowSnapshots = (e.target as HTMLInputElement).checked;
                clearInner(getElementById("version_multiselect"));

                const versionsForMultiselect = shouldShowSnapshots
                    ? versions
                    : versions.filter(v => !snapshotRegex.test(v[0]));

                setSelectedVersions(shouldShowSnapshots
                    ? currentSelectedVersions
                    : currentSelectedVersions.filter(v => !snapshotRegex.test(v[0])));
                initVersionsMultiselect(versionsForMultiselect);
                console.log(shouldShowSnapshots, versionsForMultiselect, versions)
            })
        })
        .fetchResources();
}

function formatDate(date: string | number | Date) {
    date = new Date(date);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
function updateTimestamp(timestamp: Date) {
    const timestampElement = document.getElementById("last_updated_timestamp");
    if (!timestampElement) {
        console.error("Could not find timestamp element.");
        return;
    }
    timestampElement.textContent = `List updated: ${formatDate(timestamp)}`;
}
// Data loaded from resource loader
var mod_data: Mod[];
function setModData(n_mod_data: Mod[]) {
    mod_data = n_mod_data;
}

var categoryNames: string[];
var CATEGORIES: Category[];
function setCategories(n_categories: Category[]) {
    CATEGORIES = n_categories;
}

//====================
// Filter Search Data
//====================
function getSelectedCategoryIds() {
    const selected_cat_ids: {
        and: number[];
        not: number[];
    } = {
        and: [],
        not: [],
    };

    for (const category of CATEGORIES) {
        const cat_elem = category.htmlElement;
        if (cat_elem.bool_mode == 1) {
            selected_cat_ids.and.push(cat_elem.cat_id);
        } else if (cat_elem.bool_mode == 2) {
            selected_cat_ids.not.push(cat_elem.cat_id);
        }
    }
    return selected_cat_ids;
}
// Apply filter to search data (based on user selections)
function getFilteredList() {
    const selected_cat_ids = getSelectedCategoryIds();

    let search_objs = mod_data;
    if (selected_cat_ids.and.length > 0 || selected_cat_ids.not.length > 0) {
        // Include only mods from selected categories
        search_objs = mod_data.filter((el) => {
            for (const cat_id of selected_cat_ids.and) {
                if (!el.categories.includes(cat_id)) {
                    return false;
                }
            }
            for (const cat_id of selected_cat_ids.not) {
                if (el.categories.includes(cat_id)) {
                    return false;
                }
            }
            return true;
        });
    }
    return search_objs;
}
var fabric_category_id: number;
var categories_sidebar_elem: HTMLElement;
function applyCategorySelection(cat_elem: CategoryElement) {
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

function applyCategorySelections() {
    CATEGORIES.map((cat) => cat.htmlElement).forEach(applyCategorySelection);
}

function initCategoriesSidebar() {
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
        mod_count.textContent = mod_data.length.toString();
        elem.appendChild(mod_count);
        elem.addEventListener("click", clearFilters);
        categories_sidebar_elem.appendChild(elem);

        elem.classList.add("reset_categories_button");
    };
    createAllModsElement();

    const createCategoryElement = (categoryId: number): CategoryElement => {
        const cat_elem = document.createElement("button") as CategoryElement;
        cat_elem.classList.add("reset_button");
        cat_elem.cat_id = categoryId; //category.categoryId;
        return cat_elem;
    };

    {
        // Init CATEGORIES
        setCategories(
            categoryNames.map((name, idx) => ({
                name: name,
                modCount: 0,
                htmlElement: createCategoryElement(idx),
            }))
        );

        // Mod Counts
        for (const mod of mod_data) {
            for (const cat_id of mod.categories) {
                CATEGORIES[cat_id].modCount += 1;
            }
        }
    }

    for (let i = 0; i < CATEGORIES.length; i++) {
        if (CATEGORIES[i].name.toUpperCase() === "FABRIC") {
            fabric_category_id = i;
            break;
        }
    }
    // TODO Restructure this, jfc
    for (let i = 0; i < CATEGORIES.length; i++) {}
    const sorted_CATEGORIES = CATEGORIES.slice().sort(function (a, b) {
        return b.modCount - a.modCount;
    });
    for (let i = 0; i < sorted_CATEGORIES.length; i++) {
        const category = sorted_CATEGORIES[i];
        if (category.modCount === 0) {
            continue;
        }
        const cat_elem = category.htmlElement;
        const cat_count = document.createElement("span");
        cat_elem.selected = false;
        cat_elem.textContent = category.name + " ";
        cat_elem.appendChild(cat_count);
        cat_count.textContent = category.modCount.toString();
        applyCategorySelection(cat_elem);
        cat_elem.addEventListener("click", onClick);
        categories_sidebar_elem.appendChild(cat_elem);
    }

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
        for (const cat of CATEGORIES) {
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

enum BoolMode {
    None = 0,
    And = 1,
    Not = 2,
}

//==============
// Search Logic
//==============
// Performance monitoring vars
var fuzzysortAvg = 0;
var searchCount = 0;

export type SearchOptions = Readonly<{
    search?: string;
    sortField?: string;
    sortDirection?: "asc" | "desc";
    categoryIncludes?: string[];
    categoryExcludes?: string[];
    versions?: string[];
}>;

// var searchOptions: SearchOptions;

function getSearchOptionsFromState(): SearchOptions {
    const categories = CATEGORIES.map((cat) => ({
        name: cat.name,
        bool_mode: cat.htmlElement.bool_mode,
    }));
    const categoryIncludes = categories
        .filter((cat) => cat.bool_mode === BoolMode.And)
        .map((cat) => cat.name);
    const categoryExcludes = categories
        .filter((cat) => cat.bool_mode === BoolMode.Not)
        .map((cat) => cat.name);

    const sortState = getSortState();

    return {
        search: defaultSearchInput.value,
        categoryIncludes,
        categoryExcludes,
        sortField: sortState.sortMode,
        sortDirection: sortState.sortDirection,
        versions: currentSelectedVersions.map(([str, num]) => str),
    };
}

const urlFormatCategories = (categories: string[]) =>
    categories.join(encodeURIComponent(","));

const urlDecodeCategories = (urlEncString: string | undefined | null) =>
    urlEncString ? urlEncString.split(encodeURIComponent(",")) : undefined;

function updateUrlFromSearchOptions(options: SearchOptions) {
    if ("URLSearchParams" in window) {
        var searchParams = new URLSearchParams(window.location.search);

        {
            if (options.search) {
                searchParams.set("search", options.search);
            } else {
                searchParams.delete("search");
            }
        }

        {
            if (
                options.categoryIncludes &&
                options.categoryIncludes.length > 0
            ) {
                searchParams.set(
                    "categoryIncludes",
                    urlFormatCategories(options.categoryIncludes)
                );
            } else {
                searchParams.delete("categoryIncludes");
            }

            if (
                options.categoryExcludes &&
                options.categoryExcludes.length > 0
            ) {
                searchParams.set(
                    "categoryExcludes",
                    urlFormatCategories(options.categoryExcludes)
                );
            } else {
                searchParams.delete("categoryExcludes");
            }
        }

        {
            if (options.sortField && options.sortDirection) {
                searchParams.set("sortField", options.sortField);
                searchParams.set("sortDirection", options.sortDirection);
            } else {
                searchParams.delete("sortField");
                searchParams.delete("sortDirection");
            }
        }

        {
            if (options.versions && options.versions.length > 0) {
                searchParams.set("versions", options.versions.join("|"));
            } else {
                searchParams.delete("versions");
            }
        }

        const queryAsText = searchParams.toString();
        const newRelativePathQuery =
            window.location.pathname +
            (queryAsText.length > 0 ? "?" + queryAsText : "");
        history.replaceState(null, "", newRelativePathQuery);
    }
}

function getUrlSearchValue(): string | undefined {
    var searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("search") ?? undefined;
}

function getSearchOptionsFromUrl(): SearchOptions {
    var searchParams = new URLSearchParams(window.location.search);
    return {
        search: searchParams.get("search") ?? undefined,
        categoryIncludes: urlDecodeCategories(
            searchParams.get("categoryIncludes")
        ),
        categoryExcludes: urlDecodeCategories(
            searchParams.get("categoryExcludes")
        ),
        sortField: searchParams.get("sortField") ?? undefined,
        sortDirection:
            (searchParams.get("sortDirection") as "asc" | "desc" | undefined) ??
            undefined,
        // `|| undefined` to disallow empty string ('')
        versions: searchParams.get("versions")?.split("|") || undefined,
    };
}

function selectCategories({
    categoryIncludes,
    categoryExcludes,
}: SearchOptions): void {
    categoryIncludes?.forEach((element) => {
        CATEGORIES.find((cat) => cat.name === element)!.htmlElement.bool_mode =
            BoolMode.And;
    });
    categoryExcludes?.forEach((element) => {
        CATEGORIES.find((cat) => cat.name === element)!.htmlElement.bool_mode =
            BoolMode.Not;
    });
    applyCategorySelections();
}

function search(
    queryText: string,
    search_objects: Mod[],
    selectBest = false
): { obj: Mod }[] {
    console.info("Search Query: " + queryText);

    var fuzzysortStart = performance.now();
    var maxDownloads = Math.max(...mod_data.map((mod) => mod.downloadCount));
    // mod_data[0].mc_versions
    // @ts-expect-error
    let results: { obj: Mod }[] = fuzzysort.go(
        queryText.trim(),
        search_objects,
        {
            keys: ["name", "s_author", "summary"],
            allowTypo: true,
            threshold: -500,
            // Create a custom combined score to sort by. -100 to the desc score makes it a worse match
            scoreFn: (a: { score: number }[]) =>
                Math.max(
                    a[0] ? a[0].score : -1000,
                    a[1] ? a[1].score - 50 : -1000,
                    a[2] ? a[2].score - 100 : -1000
                ) +
                ((a as any)["obj"].downloadCount as number) / maxDownloads,
        }
    );

    // Performance logging
    var fuzzysortTime = performance.now() - fuzzysortStart;
    searchCount += 1;
    fuzzysortAvg =
        (fuzzysortAvg * (searchCount - 1) + fuzzysortTime) / searchCount;
    console.log(
        `fuzzysort.js - A:${fuzzysortAvg.toFixed(
            3
        )} ms, I:${fuzzysortTime.toFixed(3)} ms, found: "${
            results[0] ? results[0].obj.name : ""
        }", numMatches: ${results.length}`
    );

    // let bestResult = results[0]

    return results;
}

registerSortListener(() => searchTextChanged(undefined, true));

const filterByVersion = (results: Mod[]) => {
    if (currentSelectedVersions && currentSelectedVersions.length > 0) {
        const selectedVersionStrings = currentSelectedVersions.map(
            ([str, num]) => str
        );
        return results.filter((mod) =>
            mod.mc_versions.some((val) => selectedVersionStrings.includes(val))
        );
    }
    return results;
};

//================
// Input Handling
//================
function searchTextChanged(value?: string, resultsPersist?: boolean) {
    const search_objects = getFilteredList();
    const searchValue = value ?? defaultSearchInput.value;

    const runSearch = (query: string) => {
        return search(query, search_objects).map((el) => el.obj);
    };

    const results = (() => {
        if (!searchValue) {
            console.log("No query data was found.");
            // If ALL mods should be shown in the even the search query was empty
            // (Ex: if the page, by default, is a mod list, not a separate page w/ a
            // search overlay)
            if (resultsPersist ?? results_persist) {
                return filterByVersion(search_objects);
            }
            return;
        }

        return filterByVersion(runSearch(searchValue));
    })();

    if (results === undefined) {
        return;
    }

    // Sort results if sorting method selected.
    const sortFunc = getSortFunc();
    const finalResults =
        sortFunc !== undefined ? Array.from(results).sort(sortFunc) : results;
    updateSearchResultsListElement(finalResults);
    // queryDisplayElement.innerText = query.target.value;
}

//=======
// Other
//=======
// Update the stored counts of mods per category
// TODO (Move this to backend?)

function updateSearchResultsListElement(resultsArray: Mod[]) {
    while (resultsListElement.firstChild) {
        resultsListElement.removeChild(resultsListElement.lastChild!);
    }

    if (resultsArray) {
        setHidden(resultsListElement, false);

        buildList(resultsArray);
    } else {
        setHidden(resultsListElement, true);
    }
    if (results_persist) {
        resultsListElement.scrollTop = 0;
    }
}

//======
// Init
//======
/**
 * A functio that takes mod data, and constructs the entire list.
 */
type ListBuilderFunc = (mods: Mod[]) => void;
var buildList: ListBuilderFunc;
/**
 * A function that creates element batches, directly adding them to the container divs.
 */
type BatchCreationFunc = (batchIdx: number, data_batches: Mod[][]) => void;
var createBatch: BatchCreationFunc;
var createListElement: (modData: Mod) => HTMLElement;
var searchHTMLElements: HTMLInputElement[];

var resultsListElement: HTMLElement;
function setResultsListElement(elem: HTMLElement) {
    resultsListElement = elem;
}
var queryDisplayElement;
var results_persist = false;
var LI_HEIGHT: number, BATCH_SIZE: number;
// Add Stylesheet
var sheet = createStyleSheet("mod-list-constructed");
function setLiHeight(liHeight: number) {
    LI_HEIGHT = liHeight;
    const gap = 4;
    const height = LI_HEIGHT * BATCH_SIZE + gap * (BATCH_SIZE - 1);
    if (sheet.cssRules.length > 0) sheet.removeRule();
    sheet.insertRule(`.item_batch {
        height: ${height}px;
        min-height: ${height}px;
        grid-template-rows: repeat(${BATCH_SIZE}, 1fr);
    }`);
    searchTextChanged();
}
var defaultSearchInput: HTMLInputElement;
type InitSearchOptions = {
    results_persist: boolean;
    li_height?: number;
    batch_size?: number;
    listElemCreationFunc?: (modData: Mod) => HTMLElement;
    batchCreationFunc: BatchCreationFunc;
    listCreationFunc?: ListBuilderFunc;
    lazyLoadBatches?: (() => void) | boolean;
};
function initSearch(options: InitSearchOptions) {
    results_persist = options.results_persist;
    const defaultOptions = {
        results_persist: false,
        li_height: 64,
        batch_size: 20,
        listElemCreationFunc: null,
        batchCreationFunc: null,
        listCreationFunc: null,
        lazyLoadBatches: true,
    };

    LI_HEIGHT = options.li_height ?? defaultOptions.li_height;
    BATCH_SIZE = options.batch_size ?? defaultOptions.batch_size;
    function resultsViewBuilder(options: InitSearchOptions) {
        if (options.listElemCreationFunc) {
            createListElement = options.listElemCreationFunc;
        } else {
            console.error(
                "Error: No mod list-element creation function supplied to function 'initSearch'"
            );
        }

        if (options.batchCreationFunc) {
            createBatch = options.batchCreationFunc;
        } else {
            createBatch = (batchIdx: number, data_batches: Mod[][]) => {
                for (const result_data of data_batches[batchIdx]) {
                    batch_containers[batchIdx].appendChild(
                        createListElement(result_data)
                    );
                }
            };
        }

        if (options.listCreationFunc) {
            buildList = options.listCreationFunc;
        } else {
            buildList = buildListBatches;
            console.info(
                "No list creation function supplied. Falling back to default."
            );
        }

        queryDisplayElement = document.getElementById("search_query_text");

        if (options.lazyLoadBatches) {
            if (options.lazyLoadBatches === true) {
                resultsListElement.addEventListener(
                    "scroll",
                    (e) => {
                        let numPxBelowBot = Number.MAX_VALUE;
                        let numPxAboveTop = Number.MAX_VALUE;
                        if (
                            last_contentful_container_idx <
                            batch_containers.length
                        )
                            numPxBelowBot = pxBelowBottom(
                                batch_containers[last_contentful_container_idx]
                            );
                        if (
                            first_contentful_container_idx <
                            batch_containers.length
                        )
                            numPxAboveTop = pxAboveTop(
                                batch_containers[first_contentful_container_idx]
                            );
                        let added = 0;
                        let addedLessThanDiff = true;

                        if (numPxBelowBot < 64) {
                            while (addedLessThanDiff) {
                                if (
                                    last_contentful_container_idx + 1 <
                                    batch_containers.length
                                ) {
                                    createBatch(
                                        last_contentful_container_idx + 1,
                                        data_batches
                                    );
                                    clearInner(
                                        batch_containers[
                                            first_contentful_container_idx
                                        ]
                                    );
                                    first_contentful_container_idx += 1;
                                    last_contentful_container_idx += 1;
                                }
                                if (added < numPxBelowBot) {
                                    addedLessThanDiff = false;
                                }
                                added -= LI_HEIGHT * BATCH_SIZE;
                            }
                        } else if (numPxAboveTop < 64) {
                            while (addedLessThanDiff) {
                                if (first_contentful_container_idx > 0) {
                                    createBatch(
                                        first_contentful_container_idx - 1,
                                        data_batches
                                    );
                                    clearInner(
                                        batch_containers[
                                            last_contentful_container_idx
                                        ]
                                    );

                                    first_contentful_container_idx -= 1;
                                    last_contentful_container_idx -= 1;
                                }
                                if (added < numPxAboveTop) {
                                    addedLessThanDiff = false;
                                }
                                added -= LI_HEIGHT * BATCH_SIZE;
                            }
                        }
                    },
                    { passive: true }
                );
            } else {
                options.lazyLoadBatches();
            }
        }
    }
    resultsViewBuilder(options);
    searchHTMLElements = [];

    defaultSearchInput = getElementById("search_input") as HTMLInputElement;
    searchHTMLElements.push(defaultSearchInput);

    for (let i = 0; i < searchHTMLElements.length; i++) {
        const elem = searchHTMLElements[i];
        if (!elem) {
            continue;
        }
        elem.addEventListener("input", (e) =>
            setTimeout(
                (value: string) => {
                    updateUrlFromSearchOptions(getSearchOptionsFromState());
                    searchTextChanged(value);
                },
                0,
                (e.target as HTMLInputElement)?.value
            )
        );
        elem.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const value = (e.target as HTMLInputElement)?.value;
                updateUrlFromSearchOptions(getSearchOptionsFromState());
                searchTextChanged(value);
            }
        });
    }
    resultsListElement =
        resultsListElement ?? getElementById("search_results_list");
    if (resultsListElement.className.includes("persist")) {
        results_persist = true;
    }

    // Add Stylesheet
    var sheet = createStyleSheet("mod-list-constructed");
    console.log(sheet.cssRules);
    queryDisplayElement = document.getElementById("search_query_text");
    console.info("mod_search_logic.js initialization complete!");
}

//======
// Util
//======
var listBuildTimeAvg = 0;
var nextBatchFunc;
var data_batches: Mod[][];
var batch_containers: HTMLDivElement[];
var first_contentful_container_idx: number;
var last_contentful_container_idx: number;
const storeBatches = (
    results: Mod[],
    startIdx: number,
    batchSize: number,
    useContainers = true
) => {
    const endIdx = startIdx + batchSize;
    const data_batch = [];
    const nextBatchSize = Math.min(batchSize, results.length - endIdx);
    if (useContainers) {
        const batch_container = document.createElement("div");
        batch_container.setAttribute("class", "item_batch");
        // batch_container.style.height = LI_HEIGHT*batchSize+'px';
        // batch_container.style.minHeight = LI_HEIGHT*batchSize+'px';

        batch_containers.push(batch_container);
        resultsListElement.appendChild(batch_container);
        if (nextBatchSize <= 0) {
            batch_container.style.height = data_batch.length * LI_HEIGHT + "px";
            batch_container.style.minHeight =
                data_batch.length * LI_HEIGHT + "px";
        }
    }

    for (let i = startIdx; i < endIdx; i++) {
        data_batch.push(results[i]);
    }
    data_batches.push(data_batch);

    if (nextBatchSize > 0)
        storeBatches(results, endIdx, nextBatchSize, useContainers);
};

var runningBatches: number[] = [];

let runBatches = (
    results: Mod[],
    batchIdx: number,
    remainingBatches = 0,
    waitForScrollAfter = 0,
    callback?: () => void
) => {
    if (batchIdx >= data_batches.length) {
        nextBatchFunc = () => {};
        return;
    } else if (batchIdx == 0) {
        // first_contentful_container_idx = batchIdx;
    }
    // const batch_elem = document.createElement('div');
    createBatch(batchIdx, data_batches);

    if (remainingBatches > 0 || remainingBatches === -1) {
        // const nextBatchSize = Math.min(batchSize, results.length - endIdx);
        const waitScroll = waitForScrollAfter > 1 || waitForScrollAfter == -1;
        const nextBatchFn = () =>
            runBatches(
                results,
                batchIdx + 1,
                remainingBatches === -1 ? -1 : remainingBatches - 1,
                waitForScrollAfter === -1
                    ? -1
                    : waitForScrollAfter > 1
                    ? waitForScrollAfter - 1
                    : 1,
                callback
            );

        if (!waitScroll) {
            last_contentful_container_idx = batchIdx;
            nextBatchFunc = nextBatchFn;
        } else {
            for (const timeout of runningBatches) {
                clearTimeout(timeout);
            }
            runningBatches = [];
            runningBatches.push(setTimeout(nextBatchFn, 0));
        }
    }
    // resultsListElement.appendChild(batch_elem);
    callback?.();
};
function resetBatches() {
    data_batches = [];
    batch_containers = [];
}
const WINDOW_SIZE = 10;
function buildListBatches(resultsArray: Mod[]) {
    let listBuildTime = performance.now();
    resultsListElement.scrollTop = 0;
    resetBatches();
    storeBatches(resultsArray, 0, Math.min(BATCH_SIZE, resultsArray.length));
    // runBatches(resultsArray, idx, Math.min(BATCH_SIZE, resultsArray.length), -1, 10);//Math.floor(window.innerHeight/40)
    runBatches(resultsArray, 0, -1, WINDOW_SIZE); //Math.floor(window.innerHeight/40)

    // This is cursed. I have no idea why, but this fixes a bug with batch generation.
    // Do not Remove w/o extensive testing of scrolling (with multiple search queries).
    // vvv
    first_contentful_container_idx = 0;

    listBuildTime = performance.now() - listBuildTime;
    listBuildTimeAvg =
        (listBuildTimeAvg * (searchCount - 1) + listBuildTime) / searchCount;
    console.log(
        `List Build - A:${listBuildTimeAvg.toFixed(
            3
        )} ms, I:${listBuildTime.toFixed(3)} ms, numMatches: ${
            resultsArray.length
        }`
    );
}
function createStyleSheet(id: string, media?: string) {
    var el = document.createElement("style");
    // WebKit hack
    el.appendChild(document.createTextNode(""));
    // el.type  = 'text/css';
    el.setAttribute("rel", "stylesheet");
    el.media = media ?? "screen";
    el.id = id;
    document.head.appendChild(el);
    if (el.sheet === null) {
        throw new Error("el.sheet was null in `createStyleSheet`.");
    }
    return el.sheet;
}
/**
 *
 * @param {HTMLElement} node
 */
function clearInner(node: HTMLElement) {
    while (node.hasChildNodes()) {
        clear(node.firstChild!);
    }
}
function clear(node: Node) {
    while (node.hasChildNodes()) {
        clear(node.firstChild!);
    }
    node.parentNode?.removeChild(node);
}
/**
 * @param {HTMLElement} el
 */
function pxBelowBottom(el: HTMLElement, scrollableElement?: HTMLElement) {
    // var rect = el.getBoundingClientRect();
    let parent = scrollableElement ?? el.parentElement!;
    let out = el.offsetTop - (parent.scrollTop + parent.clientHeight);
    return out;
}
/**
 * @param {HTMLElement} el
 */
function pxAboveTop(el: HTMLElement, scrollableElement?: HTMLElement) {
    let parent = scrollableElement ?? el.parentElement!;
    let out = parent.scrollTop - el.offsetTop;
    return out;
}
