import {
    init,
    initSearch,
    fabric_category_id,
    loader,
    mod_data,
    CATEGORIES,
    resultsListElement,
    setResultsListElement,
    batch_containers,
    setLiHeight,
} from "./mod_search_logic.js";
import { executeIfWhenDOMContentLoaded, getElementById } from "./util.js";
import {
    createCurseAuthorIcon,
    createCurseLinkIcon,
    createModrinthAuthorIcon,
    createModrinthLinkIcon,
} from "./platform_links.js";
import { Mod, Author } from "./mod_types.js";

var authorListPopup = (function createAuthorListDiv() {
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("hidden");
    contentDiv.classList.add("item_author_list");
    document.body.appendChild(contentDiv);
    return contentDiv;
})();

/**
 *
 * @param {HTMLElement} node
 */
function clearChildren(node: HTMLElement) {
    while (node.hasChildNodes()) {
        node.removeChild(node.firstChild!);
    }
}

function showAuthorList(
    listDiv: HTMLElement,
    authors: Author[],
    x: number,
    y: number,
    triggeringElement: HTMLElement,
    triggeringListener: (e: PointerEvent) => void
) {
    clearChildren(authorListPopup);

    listDiv.style.top = `${y}px`;
    listDiv.style.left = `${x}px`;

    for (const mod_author of authors) {
        const authorRow = document.createElement("div");
        const nameSpan = document.createElement("span");
        nameSpan.textContent = mod_author.name;
        authorRow.appendChild(nameSpan);
        authorRow.appendChild(createCurseAuthorIcon(mod_author));
        authorRow.appendChild(createModrinthAuthorIcon(mod_author));
        listDiv.appendChild(authorRow);
    }

    listDiv.classList.remove("hidden");
    triggeringElement.removeEventListener("pointerover", triggeringListener);
    listDiv.addEventListener(
        "pointerleave",
        (e) => {
            listDiv.classList.add("hidden");
            triggeringElement.addEventListener(
                "pointerover",
                triggeringListener
            );
        },
        { once: true }
    );
}

function fillAuthorDiv(authorDiv: HTMLDivElement, modData: Mod) {
    if (modData.authors && modData.authors.length > 0) {
        if (modData.authors.length === 1) {
            const mod_author = modData.authors[0];
            const nameSpan = document.createElement("span");
            nameSpan.textContent = mod_author.name;
            authorDiv.appendChild(nameSpan);
            authorDiv.appendChild(createCurseAuthorIcon(mod_author));
            authorDiv.appendChild(createModrinthAuthorIcon(mod_author));
        } else {
            authorDiv.textContent = "Several People...";

            const hoverListener = (e: PointerEvent) => {
                const textRect = (
                    e.target as HTMLElement
                ).getBoundingClientRect();

                showAuthorList(
                    authorListPopup,
                    modData.authors,
                    textRect.x,
                    textRect.y,
                    authorDiv,
                    hoverListener
                );
            };
            authorDiv.addEventListener("pointerover", hoverListener);
        }
    } else {
        authorDiv.innerText = "undefined";
    }
}

const numFormatOptions: Intl.NumberFormatOptions = {
    maximumFractionDigits: 1,
}
const numFormatLookup = [
    [1, ''],
    [1e3, 'K'],
    [1e6, 'M'],
    [1e9, 'B'],
] as const;
const formatNumberCompact = (num: number): string =>
{
    const [val, suffix] =
        num < 1e3 ? numFormatLookup[0]
        : num < 1e6 ? numFormatLookup[1]
        : num < 1e9 ? numFormatLookup[2]
        : num < 1e12 ? numFormatLookup[3]
        : numFormatLookup[0];

    const baseNum = (num / val);

    return val === 1
        ? baseNum.toFixed(0)
        : baseNum.toLocaleString(undefined, numFormatOptions) + " " + suffix;
}

const listElementTemplate = (() => {
    const li = document.createElement("li");

    const container = document.createElement("div");
    const front_container = document.createElement("div");
    const end_container = document.createElement("div");

    const title_container = document.createElement("div");
    const name = document.createElement("a");

    const authorDiv = document.createElement("div");

    const categories = document.createElement("ul");
    const desc = document.createElement("p");

    const startContainer = document.createElement("div");
    const dlCount = document.createElement("p");

    authorDiv.setAttribute("class", "author");
    li.setAttribute("class", "item");
    container.setAttribute("class", "container");
    front_container.setAttribute("class", "front_container");
    end_container.setAttribute("class", "end_container");
    name.setAttribute("class", "name");
    categories.setAttribute("class", "item_categories");
    desc.setAttribute("class", "desc");
    dlCount.setAttribute("class", "dl_count");
    startContainer.setAttribute("class", "start_container");

    return () => {
        const elements = {
            li:              li             .cloneNode(true) as HTMLLIElement,
            container:       container      .cloneNode(true) as HTMLDivElement,
            front_container: front_container.cloneNode(true) as HTMLDivElement,
            end_container:   end_container  .cloneNode(true) as HTMLDivElement,
            title_container: title_container.cloneNode(true) as HTMLDivElement,
            name:            name           .cloneNode(true) as HTMLAnchorElement,
            authorDiv:       authorDiv      .cloneNode(true) as HTMLDivElement,
            categories:      categories     .cloneNode(true) as HTMLUListElement,
            desc:            desc           .cloneNode(true) as HTMLParagraphElement,
            startContainer:  startContainer .cloneNode(true) as HTMLDivElement,
            dlCount:         dlCount        .cloneNode(true) as HTMLParagraphElement,
        }

        // Add elements as children where they belong and return root elem
        elements.li.appendChild(elements.startContainer);
        elements.startContainer.appendChild(elements.dlCount);
        elements.title_container.appendChild(elements.name);
        elements.title_container.insertAdjacentText("beforeend", " by ");
        elements.title_container.appendChild(elements.authorDiv);
        elements.front_container.appendChild(elements.title_container);
        elements.front_container.appendChild(elements.desc);
        elements.container.appendChild(elements.front_container);
        elements.end_container.appendChild(elements.categories);
        elements.container.appendChild(elements.end_container);
        elements.li.appendChild(elements.container);

        return elements;
    };
})()
function createListElement(modData: Mod, includeCategories = true) {
    const {
        li,
        container,
        front_container,
        end_container,
        title_container,
        name,
        authorDiv,
        categories,
        desc,
        startContainer,
        dlCount,
    } = listElementTemplate();

    try {
        desc.setAttribute("data-text", modData.summary);

        // Add DL Count Element
        dlCount.textContent = formatNumberCompact(modData.downloadCount);

        // Fill content of elements
        name.textContent = modData.name;

        fillAuthorDiv(authorDiv, modData);

        for (const category of modData.categories) {
            // if not "Fabric"
            if (category !== fabric_category_id) {
                categories.appendChild(modCategoryElements[category]());
            }
        }
        desc.textContent = modData.summary;

        end_container.appendChild(createCurseLinkIcon(modData));
        end_container.appendChild(createModrinthLinkIcon(modData));
    } catch (err) {
        console.group();
        console.warn("Failed to fill mod info.");
        console.warn(err);
        console.warn(modData);
        console.groupEnd();
    }

    return li;
}

function createListElementDetailed(modData: Mod) {
    const li = document.createElement("li");

    const front_container = document.createElement("div");
    const end_container = document.createElement("div");

    const title_container = document.createElement("div");
    const name = document.createElement("a");
    const authorDiv = document.createElement("div");
    authorDiv.setAttribute("class", "author");

    const categories = document.createElement("ul");
    const desc = document.createElement("p");

    let botContainer;

    li.classList.add("item");
    li.classList.add("detailed");
    li.classList.add("container");
    front_container.classList.add("front_container");
    end_container.classList.add("end_container");
    name.classList.add("name");
    categories.classList.add("item_categories");
    desc.classList.add("desc");

    try {
        botContainer = document.createElement("div");
        let dlCount = document.createElement("div");
        let dateUpdated = document.createElement("div");
        let latestSupportedVers = document.createElement("div");

        dlCount.classList.add("dl_count");
        dateUpdated.classList.add("date_updated");
        latestSupportedVers.classList.add("latest_version");
        botContainer.classList.add("bot_container");

        dlCount.textContent = modData.downloadCount.toLocaleString();
        dateUpdated.textContent = new Date(
            modData.dateModified
        ).toLocaleDateString();
        latestSupportedVers.textContent = modData.latestMCVersion;

        botContainer.appendChild(dlCount);
        botContainer.appendChild(dateUpdated);
        botContainer.appendChild(latestSupportedVers);

        // Fill content of elements
        name.textContent = modData.name;

        fillAuthorDiv(authorDiv, modData);

        for (const category of modData.categories) {
            // if not "Fabric"
            if (category !== fabric_category_id) {
                const catElem = document.createElement("li");
                catElem.textContent = CATEGORIES[category].name;
                categories.appendChild(catElem);
            }
        }
        desc.textContent = modData.summary;

        end_container.appendChild(createCurseLinkIcon(modData));
        end_container.appendChild(createModrinthLinkIcon(modData));
        // Add elements as children where they belong and return root elem
        title_container.appendChild(name);
        title_container.insertAdjacentText("beforeend", " by ");
        title_container.appendChild(authorDiv);
        front_container.appendChild(title_container);
        front_container.appendChild(desc);
        li.appendChild(front_container);
        end_container.appendChild(categories);
        li.appendChild(end_container);
        li.appendChild(botContainer);
    } catch (err) {
        console.group();
        console.warn("Failed to fill mod info.");
        console.warn(err);
        console.warn(modData);
        console.groupEnd();
    }

    return li;
}

var createBatch = (batchIdx: number, data_batches: Mod[][]) => {
    for (const result_data of data_batches[batchIdx]) {
        try {
            batch_containers[batchIdx].appendChild(
                currentListCreationFunc(result_data)
            );
        } catch (err) {
            batch_containers[batchIdx]
                .appendChild(document.createElement("li"))
                .setAttribute("class", "item");

            console.warn(err);
            console.warn(result_data);
        }
    }
};

loader.addCompletionFunc(() =>
    setResultsListElement(getElementById("search_results_list"))
);

var modCategoryElements: (() => Node)[];
loader.addCompletionFunc(() => {
    modCategoryElements = (() => {
        const categoryReferenceElements = CATEGORIES
            .map(c => {
                const catElem = document.createElement("li");
                catElem.textContent = c.name;
                return catElem;
            });
        return categoryReferenceElements.map((c) => () => c.cloneNode(true));
    })();
})

function getLiHeight() {
    const fmt = (val: string) => val.slice(0, val.length - 2);
    const style = getComputedStyle(resultsListElement);
    const pseudoPadding = parseInt(
        fmt(style.getPropertyValue("--pseudo-padding"))
    );
    const titleFontSize = parseInt(
        fmt(style.getPropertyValue("--title-font-size"))
    );
    const descFontSize = parseInt(
        fmt(style.getPropertyValue("--desc-font-size"))
    );
    const descLineCount = parseInt(style.getPropertyValue("--desc-line-count"));
    const borderThickness = parseInt(
        style.getPropertyValue("--border-thickness")
    );
    return (
        2 * pseudoPadding +
        2 * borderThickness +
        titleFontSize +
        descFontSize * descLineCount
    );
}

function getLiHeightDetailed() {
    const fmt = (val: string) => val.slice(0, val.length - 2);
    const style = getComputedStyle(resultsListElement);
    const pseudoPadding = parseInt(
        fmt(style.getPropertyValue("--pseudo-padding"))
    );
    const titleFontSize = parseInt(
        fmt(style.getPropertyValue("--title-font-size"))
    );
    const descFontSize = parseInt(
        fmt(style.getPropertyValue("--desc-font-size"))
    );
    const descLineCount = parseInt(style.getPropertyValue("--desc-line-count"));
    const borderThickness = parseInt(
        style.getPropertyValue("--border-thickness")
    );
    return (
        2 * pseudoPadding +
        2 * borderThickness +
        titleFontSize +
        descFontSize * descLineCount +
        36 +
        8
    );
}

var viewModes = [createListElement, createListElementDetailed];
var modeLiHeights = [getLiHeight, getLiHeightDetailed];
const CURRENT_LIST_VIEW_IDX_STORAGE_KEY = "currentListViewIdx";
var currentViewIdx =
    Number(window.localStorage.getItem(CURRENT_LIST_VIEW_IDX_STORAGE_KEY)) ?? 0;
var currentListCreationFunc = viewModes[0];
function updateViewModes() {
    currentListCreationFunc = viewModes[currentViewIdx];
    setLiHeight(modeLiHeights[currentViewIdx]());
}
function cycleListViewModes() {
    currentViewIdx++;
    if (currentViewIdx >= viewModes.length) {
        currentViewIdx = 0;
    }
    window.localStorage.setItem(
        CURRENT_LIST_VIEW_IDX_STORAGE_KEY,
        currentViewIdx.toString()
    );
    updateViewModes();
}

executeIfWhenDOMContentLoaded(() => {
    getElementById("list_view_cycle_button").addEventListener(
        "click",
        cycleListViewModes
    );
});

loader.addCompletionFunc(() => {
    initSearch({
        results_persist: true,
        batchCreationFunc: createBatch,
        lazyLoadBatches: true,
        batch_size: 20,
        li_height: modeLiHeights[currentViewIdx](),
    });
    updateViewModes();
});

init();
