import { ListElementRenderer } from "./list_elem_renderer.js";
import { fillAuthorDiv, getElementForCategory } from "./list_item_shared.js";
import { fabric_category_id } from "./mod_search_logic.js";
import { Mod } from "./mod_types.js";
import { formatNumberCompact } from "./number_formatter.js";
import {
    createCurseLinkIcon,
    createModrinthLinkIcon,
} from "./platform_links.js";

// prettier-ignore
type ListElementTemplate = {
    li:              HTMLLIElement,
    container:       HTMLDivElement,
    front_container: HTMLDivElement,
    end_container:   HTMLDivElement,
    title_container: HTMLDivElement,
    name:            HTMLAnchorElement,
    authorDiv:       HTMLDivElement,
    categories:      HTMLUListElement,
    desc:            HTMLParagraphElement,
    startContainer:  HTMLDivElement,
    dlCount:         HTMLParagraphElement,
}

const listElementTemplate: () => ListElementTemplate = (() => {
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
        // prettier-ignore
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
})();

class DefaultListElementRendererImpl extends ListElementRenderer<
    Mod,
    ListElementTemplate,
    HTMLLIElement
> {
    protected listElementTemplate = listElementTemplate;

    protected fillListElementData(
        elements: ListElementTemplate,
        modData: Mod
    ): void {
        const { end_container, name, authorDiv, categories, desc, dlCount } =
            elements;

        try {
            authorDiv.replaceChildren();
            categories.replaceChildren();

            desc.setAttribute("data-text", modData.summary);

            // Add DL Count Element
            dlCount.textContent = formatNumberCompact(modData.downloadCount);

            // Fill content of elements
            name.textContent = modData.name;

            fillAuthorDiv(authorDiv, modData);

            for (const category of modData.categories) {
                // if not "Fabric"
                if (category !== fabric_category_id) {
                    categories.appendChild(getElementForCategory(category)());
                }
            }
            desc.textContent = modData.summary;

            end_container.replaceChildren(
                categories,
                createCurseLinkIcon(modData),
                createModrinthLinkIcon(modData)
            );
        } catch (err) {
            console.group();
            console.warn("Failed to fill mod info.");
            console.warn(err);
            console.warn(modData);
            console.groupEnd();
        }
    }

    protected getElementFromElemData(
        elements: ListElementTemplate
    ): HTMLLIElement {
        return elements.li;
    }
}

export const DefaultListElementRenderer = () => {
    const renderer = new DefaultListElementRendererImpl();
    return renderer.createElement.bind(renderer);
};
