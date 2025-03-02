import { setHidden, getElementById } from "./util.js";
import { AsyncDataResourceLoader } from "./resource_loader";
import {
    getSortFunc,
    getSortState,
    registerListener as registerSortListener,
    setSortMode,
} from "./table_sort.js";
import { BaseMod, Mod, baseModToMod, versionOrd } from "./mod_types.js";
import { initMultiselectElement } from "./multiselect.js";
import {  MOD_DATA } from "./search_page_state"
import { PGlite } from "@electric-sql/pglite";
import { effect } from "./effect.js";
import { CATEGORIES, initCategoriesSidebar, BoolMode, getSelectedCategoryIds, updateFilteredCategoryModCounts } from "./initCategoriesSidebar.js";

let prevTime = performance.now();
function logtime(message: string) {
    console.log("PERF: " + message, performance.now() - prevTime);
    prevTime = performance.now();
}

logtime("start file");
const db = new PGlite("idb://fibermc");
await db.waitReady;
logtime("Database Ready!");

export {
    init,
    initSearch,
    mod_data,
    setModData,
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
    registerOnLoad,
};

console.log("PROOF OF ALIVE");

//==============
// DATA LOADING
//==============
console.log("hostname", window.location.hostname);
const apiUrl = `https://${
    // window.location.hostname === "localhost"
    //     ? "localhost:5001"
    //     : window.location.hostname
    "dev.fibermc.com"
}/api/v1.0`;

var localLoader = new AsyncDataResourceLoader({
    completionWaitForDCL: true,
})
    .addResourceFn<Mod[] | undefined>(async () => {
        logtime("Start local db query");
        if (!db) {
            return undefined;
        }
        console.log("HAVE DB");
        // const res = await db.query("SELECT COUNT(*) FROM mod_data;");
        // // @ts-ignore
        // console.log("CHECK DB RES", res, res.rows[0].count);

        // @ts-ignore
        // if (res.rows[0].count) {
        console.log("HAVE ROWS");

        const temp_mod_data = await db.query(
            `SELECT
                id,
                name,
                mr_slug,
                cf_slug,
                summary,
                categories,
                authors,
                date_released as "dateReleased",
                date_modified as "dateModified",
                download_count as "downloadCount",
                mc_versions,
                s_name,
                s_latest_mc_version as "s_latestMCVersion"
            FROM mod_data ORDER BY download_count DESC LIMIT 100;
            `
        );
        logtime("Start local db query...done!");
        return temp_mod_data.rows as Mod[];
        // }
    }, [
        async (temp_mod_data) => {
            if (!temp_mod_data) {
                return;
            }
            console.log("SET ROWS", temp_mod_data);

            setModData(temp_mod_data);
            mod_data.sort((a, b) => b.downloadCount - a.downloadCount);
        },
    ])
    .addResource<string[]>(`${apiUrl}/Categories`, [
        (jsonData) => {
            CATEGORIES.NAMES.set(jsonData);
            console.log("categoryNames", jsonData);
        },
    ])
    .addCompletionFunc(() => {
        effect(() => {
            initCategoriesSidebar();
        })        
    });

configureModsLoader(localLoader);

// Load mod data from external file
var loader = new AsyncDataResourceLoader({
    completionWaitForDCL: true,
})
    .addResource<BaseMod[]>(`${apiUrl}/Mods`, [
        async (jsonData) => {
            setModData(jsonData.map(baseModToMod));
            // Sort descending
            mod_data.sort((a, b) => b.downloadCount - a.downloadCount);
            logtime("api data loaded");
            console.log("mod_data", mod_data);
            console.log("TABLE CREATED IF NEEDED");

            //-- DROP TABLE IF EXISTS mod_data;
            //
            // First create the table if it doesn't exist
            await db.exec(`
        CREATE TABLE IF NOT EXISTS mod_data (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            mr_slug TEXT,
            cf_slug TEXT,
            summary TEXT,
            categories INT4[], -- Text array for categories
            authors JSONB,     -- JSONB for authors
            date_released TIMESTAMP,
            date_modified TIMESTAMP,
            download_count BIGINT,
            mc_versions TEXT[], -- Text array for versions
            s_name TEXT,
            s_latest_mc_version NUMERIC,
            s_date_modified BIGINT,
            latest_mc_version TEXT,
            s_author TEXT
        );
                    `);

            // Batch processing using PGlite's transaction feature
            await db.transaction(async (tx) => {
                // Process in batches to avoid memory issues
                const BATCH_SIZE = 500;

                for (let i = 0; i < mod_data.length; i += BATCH_SIZE) {
                    const batch = mod_data.slice(i, i + BATCH_SIZE);
                    console.log(
                        `Processing batch ${
                            Math.floor(i / BATCH_SIZE) + 1
                        } of ${Math.ceil(mod_data.length / BATCH_SIZE)}`
                    );

                    // Create a large multi-value INSERT statement
                    let valuesSql = [];
                    let params = [];
                    let paramIndex = 1;

                    for (const mod of batch) {
                        // Add placeholders for this row
                        valuesSql.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, 
                        $${paramIndex++}::INT4[], $${paramIndex++}::jsonb, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, 
                        $${paramIndex++}::text[], $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, 
                        $${paramIndex++})`);

                        // Add values to params array
                        params.push(
                            mod.id,
                            mod.name,
                            mod.mr_slug,
                            mod.cf_slug,
                            mod.summary,
                            mod.categories,
                            JSON.stringify(mod.authors),
                            mod.dateReleased,
                            mod.dateModified,
                            mod.downloadCount,
                            mod.mc_versions,
                            mod.s_name,
                            mod.s_latestMCVersion,
                            mod.s_dateModified,
                            mod.latestMCVersion,
                            mod.s_author
                        );
                    }

                    // Build the complete query with all batch values
                    const query = `
        INSERT INTO mod_data (
          id, name, mr_slug, cf_slug, summary, categories, authors,
          date_released, date_modified, download_count, mc_versions,
          s_name, s_latest_mc_version, s_date_modified, latest_mc_version, s_author
        )
        VALUES ${valuesSql.join(",")}
        ON CONFLICT (id) 
        DO UPDATE SET
          name = EXCLUDED.name,
          mr_slug = EXCLUDED.mr_slug,
          cf_slug = EXCLUDED.cf_slug,
          summary = EXCLUDED.summary,
          categories = EXCLUDED.categories,
          authors = EXCLUDED.authors,
          date_released = EXCLUDED.date_released,
          date_modified = EXCLUDED.date_modified,
          download_count = EXCLUDED.download_count,
          mc_versions = EXCLUDED.mc_versions,
          s_name = EXCLUDED.s_name,
          s_latest_mc_version = EXCLUDED.s_latest_mc_version,
          s_date_modified = EXCLUDED.s_date_modified,
          latest_mc_version = EXCLUDED.latest_mc_version,
          s_author = EXCLUDED.s_author
      `;

                    await tx.query(query, params);
                }
            });
            console.log(
                "DONE SETUP",
                await db.query("SELECT * FROM mod_data;")
            );
        },
    ])
    .addResource<string[]>(`${apiUrl}/Categories`, [
        (jsonData) => {
            CATEGORIES.NAMES.set(jsonData);
            console.log("categoryNames", jsonData);
        },
    ])
    .addCompletionFunc(() => {
        effect(() => {
            initCategoriesSidebar();
        })        
    });
configureModsLoader(loader);

var timestamp: string;
var currentSelectedVersions: [string, number][] = [];

function registerOnLoad(fn: () => void): void {
    localLoader.addCompletionFunc(fn);
    loader.addCompletionFunc(fn);
}

function configureModsLoader(loader: AsyncDataResourceLoader): void {
    loader
        .addCompletionFunc(() => {
            GLOBAL_SEARCH_OPTIONS.preInitializationCallbacks.forEach((fn) =>
                fn()
            );
        })
        .addCompletionFunc(() => {
            initSearchInternal();
        })
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

            const showSnapshotsLabel = document.createElement("label");
            showSnapshotsLabel.textContent = "show snapshots";
            showSnapshotsLabel.classList.add("button");
            const showSnapshotsCheckbox = document.createElement("input");
            showSnapshotsCheckbox.type = "checkbox";
            showSnapshotsCheckbox.id = "snapshot_toggle";
            const getSnapshotsLabel = () => {
                showSnapshotsLabel.textContent = "show snapshots";
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
            const initVersionsMultiselect = (
                versionsForMultiselect: [string, number][]
            ) => {
                initMultiselectElement({
                    rootElement: getElementById("version_multiselect"),
                    options: versionsForMultiselect,
                    setSelectedValues: (setter) => {
                        setSelectedVersions(setter(currentSelectedVersions));
                    },
                    currentValues: currentSelectedVersions,
                    renderValue: (val) => val[0],
                    key: (val) => val[1], // gets the version in num form,
                    leadingChildren: [getSnapshotsLabel()],
                });
            };
            const snapshotRegex = /[a-z]/i;
            const anyAreSnapshots = (versionsToTest: [string, number][]) =>
                versionsToTest.some((v) => !snapshotRegex.test(v[0]));
            initVersionsMultiselect(
                anyAreSnapshots(currentSelectedVersions)
                    ? versions
                    : versions.filter((v) => !snapshotRegex.test(v[0]))
            );

            showSnapshotsCheckbox.addEventListener("change", (e) => {
                const shouldShowSnapshots = (e.target as HTMLInputElement)
                    .checked;
                clearInner(getElementById("version_multiselect"));

                const versionsForMultiselect = shouldShowSnapshots
                    ? versions
                    : versions.filter((v) => !snapshotRegex.test(v[0]));

                setSelectedVersions(
                    shouldShowSnapshots
                        ? currentSelectedVersions
                        : currentSelectedVersions.filter(
                              (v) => !snapshotRegex.test(v[0])
                          )
                );
                initVersionsMultiselect(versionsForMultiselect);
                console.log(
                    shouldShowSnapshots,
                    versionsForMultiselect,
                    versions
                );
            });
        });
}

function init() {
    localLoader.fetchResources();
    loader.fetchResources();
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
    MOD_DATA.set(n_mod_data)
}

//====================
// Filter Search Data
//====================

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

export function getSearchOptionsFromState(): SearchOptions {
    const categories = CATEGORIES.BY_ID.map((cat) => ({
        name: cat.name,
        bool_mode: cat.boolMode,
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

export function updateUrlFromSearchOptions(options: SearchOptions) {
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

export function getSearchOptionsFromUrl(): SearchOptions {
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

        switch ((window as any).fiberVersionFilterMode) {
            case "allMatch":
                return results.filter((mod) =>
                    mod.mc_versions.every((val) =>
                        selectedVersionStrings.includes(val)
                    )
                );
            case "noneMatch":
                return results.filter((mod) =>
                    mod.mc_versions.every(
                        (val) => !selectedVersionStrings.includes(val)
                    )
                );
            default:
                return results.filter((mod) =>
                    mod.mc_versions.some((val) =>
                        selectedVersionStrings.includes(val)
                    )
                );
        }
    }
    return results;
};

//================
// Input Handling
//================
export function searchTextChanged(value?: string, resultsPersist?: boolean) {
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
    updateSearchResults(finalResults);
    // queryDisplayElement.innerText = query.target.value;
}

function updateSearchResults(results: Mod[]) {
    updateSearchResultsListElement(results);
    updateFilteredCategoryModCounts(results);
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
var computeLiHeightPx = (liHeight: number, batchSize: number) => {
    const gap = 4;
    return liHeight * batchSize + gap * (batchSize - 1);
};
function setLiHeight(liHeight: number) {
    LI_HEIGHT = liHeight;
    const gap = 4;
    const height = computeLiHeightPx(LI_HEIGHT, BATCH_SIZE);
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
    li_height?: () => number;
    batch_size?: number;
    listElemCreationFunc?: (modData: Mod) => HTMLElement;
    batchCreationFunc: BatchCreationFunc;
    listCreationFunc?: ListBuilderFunc;
    lazyLoadBatches?: (() => void) | boolean;
    /**
     * pre-initialization callbacks, because order matters
     */
    preInitializationCallbacks: (() => void)[];
};
var GLOBAL_SEARCH_OPTIONS: InitSearchOptions;
function initSearch(options: InitSearchOptions) {
    GLOBAL_SEARCH_OPTIONS = options;
}
function initSearchInternal() {
    const options = GLOBAL_SEARCH_OPTIONS;
    // options.preInitializationCallbacks.forEach((fn) => fn());

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

    LI_HEIGHT = options.li_height?.() ?? defaultOptions.li_height;
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
                                    clearShallow(
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
                                    clearShallow(
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

    const data_batch: Mod[] = results.slice(
        startIdx,
        Math.min(endIdx, results.length)
    );
    data_batches.push(data_batch);

    const nextBatchSize = Math.min(batchSize, results.length - endIdx);

    if (useContainers) {
        const batch_container = document.createElement("div");
        batch_container.setAttribute("class", "item_batch");

        batch_containers.push(batch_container);
        resultsListElement.appendChild(batch_container);

        if (nextBatchSize <= 0) {
            const heightStyle =
                computeLiHeightPx(LI_HEIGHT, data_batch.length) + "px";
            batch_container.style.height = heightStyle;
            batch_container.style.minHeight = heightStyle;
        }
    }

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

function clearShallow(node: HTMLElement) {
    for (const c of node.childNodes) {
        (c as any).free?.();
    }
    node.replaceChildren();
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
