import { ListElementRenderer } from "./list_elem_renderer.js";
import { fillAuthorDiv, getElementForCategory } from "./list_item_shared.js";
import { CATEGORIES, fabric_category_id } from "./mod_search_logic.js";
import { Mod } from "./mod_types.js";
import { formatNumberCompact } from "./number_formatter.js";
import {
    createCurseLinkIcon,
    createModrinthLinkIcon,
} from "./platform_links.js";

type ListElementTemplate = {
    li: HTMLLIElement;
    front_container: HTMLDivElement;
    end_container: HTMLDivElement;
    title_container: HTMLDivElement;
    name: HTMLAnchorElement;
    authorDiv: HTMLDivElement;
    categories: HTMLUListElement;
    desc: HTMLParagraphElement;
    botContainer: HTMLDivElement;
    dlCount: HTMLParagraphElement;
    dateUpdated: HTMLDivElement;
    latestSupportedVers: HTMLDivElement;
};

const listElementTemplate: () => ListElementTemplate = (() => {
    const li = document.createElement("li");

    const front_container = document.createElement("div");
    const end_container = document.createElement("div");

    const title_container = document.createElement("div");
    const name = document.createElement("a");
    const authorDiv = document.createElement("div");
    authorDiv.setAttribute("class", "author");

    const categories = document.createElement("ul");
    const desc = document.createElement("p");

    li.classList.add("item");
    li.classList.add("detailed");
    li.classList.add("container");
    front_container.classList.add("front_container");
    end_container.classList.add("end_container");
    name.classList.add("name");
    categories.classList.add("item_categories");
    desc.classList.add("desc");

    const botContainer = document.createElement("div");
    const dlCount = document.createElement("div");
    const dateUpdated = document.createElement("div");
    const latestSupportedVers = document.createElement("div");

    dlCount.classList.add("dl_count");
    dateUpdated.classList.add("date_updated");
    latestSupportedVers.classList.add("latest_version");
    botContainer.classList.add("bot_container");

    return () => {
        // prettier-ignore
        const elements = {
            li:              li             .cloneNode(true) as HTMLLIElement,
            front_container: front_container.cloneNode(true) as HTMLDivElement,
            end_container:   end_container  .cloneNode(true) as HTMLDivElement,
            title_container: title_container.cloneNode(true) as HTMLDivElement,
            name:            name           .cloneNode(true) as HTMLAnchorElement,
            authorDiv:       authorDiv      .cloneNode(true) as HTMLDivElement,
            categories:      categories     .cloneNode(true) as HTMLUListElement,
            desc:            desc           .cloneNode(true) as HTMLParagraphElement,
            botContainer:    botContainer   .cloneNode(true) as HTMLDivElement,
            dlCount:         dlCount        .cloneNode(true) as HTMLParagraphElement,
            dateUpdated:     dateUpdated    .cloneNode(true) as HTMLDivElement, 
            latestSupportedVers: latestSupportedVers.cloneNode(true) as HTMLDivElement, 
        }

        // Add elements as children where they belong and return root elem

        elements.botContainer.appendChild(elements.dlCount);
        elements.botContainer.appendChild(elements.dateUpdated);
        elements.botContainer.appendChild(elements.latestSupportedVers);

        elements.title_container.appendChild(elements.name);
        elements.title_container.insertAdjacentText("beforeend", " by ");
        elements.title_container.appendChild(elements.authorDiv);
        elements.front_container.appendChild(elements.title_container);
        elements.front_container.appendChild(elements.desc);

        elements.li.appendChild(elements.front_container);
        elements.li.appendChild(elements.end_container);
        elements.li.appendChild(elements.botContainer);

        return elements;
    };
})();

class DetailedListElementRendererImpl extends ListElementRenderer<
    Mod,
    ListElementTemplate,
    HTMLLIElement
> {
    protected listElementTemplate = listElementTemplate;

    protected fillListElementData(
        elements: ListElementTemplate,
        modData: Mod
    ): void {
        const {
            end_container,
            name,
            authorDiv,
            categories,
            desc,
            dlCount,
            botContainer,
            dateUpdated,
            latestSupportedVers,
        } = elements;

        try {
            dlCount.textContent = modData.downloadCount.toLocaleString();
            dateUpdated.textContent = new Date(
                modData.dateModified
            ).toLocaleDateString();
            latestSupportedVers.textContent = modData.latestMCVersion;

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
            end_container.appendChild(categories);
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

export const DetailedListElementRenderer = () => {
    const renderer = new DetailedListElementRendererImpl();
    return renderer.createElement.bind(renderer);
};
