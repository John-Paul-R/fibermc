import { SearchOptions } from "./mod_search_logic.js";
import { Mod, Author } from "./mod_types.js";

type SortColumnClass = "t_name" | "t_auth" | "t_dl" | "t_vers" | "t_date";
type SortableModField =
    | "name"
    | "author"
    | "downloadCount"
    | "latestMCVersion"
    | "dateModified";

type ColumnClassToModPropertyMap = Record<SortColumnClass, SortableModField>;

var sortable_cols: ColumnClassToModPropertyMap = {
    t_name: "name",
    t_auth: "author",
    t_dl: "downloadCount",
    t_vers: "latestMCVersion",
    t_date: "dateModified",
};

type ModSortFunc = (a: Mod, b: Mod) => number;

var sort_funcs: Record<string, ModSortFunc> = {
    name: (a, b) => {
        return a["s_name"] > b["s_name"] ? 1 : -1;
    },
    author: (a, b) => {
        if (!(a["authors"] && b["authors"])) {
            return 1;
        }
        if (!a.authors && b.authors) {
            return 1;
        }
        if (a.authors && !b.authors) {
            return -1;
        }
        return a["authors"][0]?.name.toLowerCase() >
            b["authors"][0]?.name.toLowerCase()
            ? 1
            : -1;
    },
    downloadCount: (a, b) => {
        return a["downloadCount"] < b["downloadCount"] ? 1 : -1;
    },
    latestMCVersion: (a, b) => {
        return a["s_latestMCVersion"] < b["s_latestMCVersion"] ? 1 : -1;
    },
    dateModified: (a, b) => {
        return a["s_dateModified"] < b["s_dateModified"] ? 1 : -1;
    },
};

var default_order = {
    name: "ascending",
    author: "ascending",
    downloadCount: "descending",
    latestMCVersion: "descending",
    dateModified: "descending",
};

type SortMode = SortableModField | null;
var sortMode: SortMode = null;
var reverseNum = 1;
function finalizeSortFunc(func: ModSortFunc) {
    if (!func) return func;
    return (a: Mod, b: Mod) => func(a, b) * reverseNum;
}

var onModeChangeFuncs: Array<(mode: SortMode) => void> = [];

interface TableSortButtonElement extends Element {
    col_field: SortableModField;
}

interface TableSortableHeaderElement extends Element {
    id: SortColumnClass;
}

const sortBtns = document.getElementsByClassName(
    "tbl_sort"
) as HTMLCollectionOf<TableSortButtonElement>;

const isTableSortableHeaderElement = (
    el: Element
): el is TableSortableHeaderElement =>
    !!el.id && Object.keys(sortable_cols).includes(el.id);

const toReverseNum = (
    sortMode: SortableModField,
    direction: "asc" | "desc" | undefined
) => {
    if (!direction) {
        return 0;
    }
    const baseOrder = default_order[sortMode] === "ascending" ? 1 : -1;
    const selectedOrder = baseOrder * (direction === "asc" ? 1 : -1);
    return selectedOrder;
};

function toDirection(sortMode: SortableModField, directionMultiplier: number) {
    const baseOrder = default_order[sortMode] === "ascending" ? 1 : -1;
    const selectedOrder = baseOrder * directionMultiplier;
    return selectedOrder === 1 ? "asc" : "desc";
}

const stringIsSortable = (str: string): str is SortableModField => {
    if (!str) {
        return false;
    }
    return (Object.values(sortable_cols) as string[]).includes(str);
};

export function setSortMode({
    sortField,
    sortDirection,
}: Pick<SearchOptions, "sortField" | "sortDirection">) {
    if (sortField === undefined) {
        sortMode = null;
        return;
    }
    if (!stringIsSortable(sortField)) {
        return;
    }
    sortMode = sortField;
    reverseNum = sortField ? toReverseNum(sortField, sortDirection) : 0;
    updateSortIndicators(true);
    onModeChangeFuncs.forEach((func) => func(sortMode));
}

(async function () {
    console.log(sortBtns);
    if (sortBtns.length === 0) {
        return;
    }
    for (const btn of sortBtns) {
        if (!btn.parentElement) {
            throw new Error("Table sort button parent element was null.");
        }

        if (!isTableSortableHeaderElement(btn.parentElement)) {
            console.error(btn, btn.parentElement);
            throw new Error(
                "Table sort button parent element missing a valid sort css class (see sortable_columns)."
            );
        }

        btn.col_field = sortable_cols[btn.parentElement.id];
        btn.parentElement.addEventListener("click", (e) => {
            // if already selected, rotate order, or deselect.
            if (sortMode === btn.col_field) {
                if (reverseNum === -1) {
                    reverseNum = 1;
                    sortMode = null;
                } else {
                    reverseNum = -1;
                }
                btn.classList.toggle("ascending");
            } else {
                sortMode = btn.col_field;
                reverseNum = 1;
                if (default_order[sortMode] === "ascending") {
                    btn.classList.add("ascending");
                }
            }

            updateSortIndicators();

            for (const func of onModeChangeFuncs) {
                func(sortMode);
            }
        });
    }
})();

export function getSortFunc() {
    return sortMode ? finalizeSortFunc(sort_funcs[sortMode]) : undefined;
}

type SortState = Readonly<{
    sortMode: SortableModField | undefined;
    sortDirection: "asc" | "desc" | undefined;
}>;
export function getSortState(): SortState {
    if (!sortMode) {
        return {
            sortMode: undefined,
            sortDirection: undefined,
        };
    }

    return {
        sortMode: sortMode,
        sortDirection: toDirection(sortMode, reverseNum),
    };
}

export function registerListener(callback: (mode: SortMode) => void) {
    onModeChangeFuncs.push(callback);
}

function updateSortIndicators(recalculate = false) {
    for (const btn of sortBtns) {
        if (recalculate) {
            if (sortMode === btn.col_field) {
                if (toDirection(sortMode, reverseNum) === "asc") {
                    btn.classList.add("ascending");
                } else {
                    btn.classList.remove("ascending");
                }
            }
        }

        if (btn.col_field == sortMode) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }

        if (btn.classList.contains("active")) {
            if (btn.classList.contains("ascending")) {
                btn.textContent = "north";
            } else {
                btn.textContent = "south";
            }
        } else {
            btn.textContent = "sort";
        }
    }
}
