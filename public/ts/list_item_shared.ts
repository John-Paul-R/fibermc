import { Author, Mod } from "./mod_types.js";
import {
    createCurseAuthorIcon,
    createModrinthAuthorIcon,
} from "./platform_links.js";

var modCategoryElements: (() => Node)[];

export function setModCategoryElements(renderers: (() => Node)[]) {
    modCategoryElements = renderers;
}

export function getElementForCategory(categoryId: number): () => Node {
    return modCategoryElements[categoryId];
}

// LIST ITEM AUTHORS LIST

var authorListPopup = (function createAuthorListDiv() {
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("hidden");
    contentDiv.classList.add("item_author_list");
    document.body.appendChild(contentDiv);
    contentDiv.addEventListener("click", (e) => e.stopPropagation());
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

/**
 *
 * @param listDiv
 * @param authors
 * @param x
 * @param y
 * @param hoverTrigger if null, don't unregister any listeners
 */
function showAuthorList(
    listDiv: HTMLElement,
    authors: Author[],
    x: number,
    y: number,
    hoverTrigger?: {
        element: HTMLElement;
        listener: (e: MouseEvent) => void;
    }
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

    let isActive = true;
    listDiv.classList.remove("hidden");
    hoverTrigger?.element.removeEventListener(
        "mouseover",
        hoverTrigger.listener
    );

    const handleExit = () => {
        isActive = false;
        listDiv.classList.add("hidden");
        hoverTrigger?.element.addEventListener(
            "mouseover",
            hoverTrigger.listener
        );
        document.body.removeEventListener("click", handleExit);
    };

    document.body.addEventListener("click", handleExit);

    if (hoverTrigger) {
        const checkForExit = () => {
            if (
                !isActive ||
                !(
                    listDiv.matches(":hover") ||
                    hoverTrigger.element.matches(":hover")
                )
            ) {
                handleExit();
                return;
            }
            requestAnimationFrame(checkForExit);
        };
        setTimeout(() => checkForExit(), 1);
    }
}

export function fillAuthorDiv(authorDiv: HTMLDivElement, modData: Mod) {
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

            const hoverListener = (e: MouseEvent) => {
                const textRect = (
                    e.target as HTMLElement
                ).getBoundingClientRect();

                showAuthorList(
                    authorListPopup,
                    modData.authors,
                    textRect.x,
                    textRect.y,
                    {
                        element: authorDiv,
                        listener: hoverListener,
                    }
                );
            };
            authorDiv.addEventListener("mouseover", hoverListener);

            authorDiv.addEventListener("click", (e) => {
                const textRect = (
                    e.target as HTMLElement
                ).getBoundingClientRect();

                showAuthorList(
                    authorListPopup,
                    modData.authors,
                    textRect.x,
                    textRect.y
                );

                e.stopPropagation();
            });
        }
    } else {
        authorDiv.innerText = "undefined";
    }
}
