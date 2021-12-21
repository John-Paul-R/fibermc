import { getCurseAuthorUrl, getCurseModUrl, getModrinthAuthorUrl, getModrinthModUrl, } from "./mod_types.js";
export const createCurseLinkIcon = (modData) => {
    const cfAnchor = document.createElement("a");
    const cfAnchorIcon = document.createElement("div");
    if (modData.cf_slug) {
        cfAnchor.setAttribute("href", getCurseModUrl(modData.cf_slug));
        cfAnchor.setAttribute("target", "_blank");
    }
    else {
        cfAnchor.classList.add("filter-grey");
        cfAnchor.title = `No CurseForge link found for ${modData.name}.`;
    }
    cfAnchor.classList.add("icon_button");
    cfAnchorIcon.classList.add("cf_icon");
    cfAnchorIcon.classList.add("icon_dark"); // for multi-pallete-js
    cfAnchor.appendChild(cfAnchorIcon);
    return cfAnchor;
};
export const createModrinthLinkIcon = (modData) => {
    const mrAnchor = document.createElement("a");
    const mrAnchorIcon = document.createElement("div");
    if (modData.mr_slug) {
        mrAnchor.setAttribute("href", getModrinthModUrl(modData.mr_slug));
        mrAnchor.setAttribute("target", "_blank");
    }
    else {
        mrAnchor.classList.add("filter-grey");
        mrAnchor.title = `No Modrinth link found for ${modData.name}.`;
    }
    mrAnchor.classList.add("icon_button");
    mrAnchorIcon.classList.add("mr_icon");
    mrAnchor.appendChild(mrAnchorIcon);
    return mrAnchor;
};
export const createCurseAuthorIcon = (author) => {
    const cfAnchor = document.createElement("a");
    const cfAnchorIcon = document.createElement("div");
    if (author.cf_slug) {
        cfAnchor.setAttribute("href", getCurseAuthorUrl(author.cf_slug));
        cfAnchor.setAttribute("target", "_blank");
    }
    else {
        cfAnchor.classList.add("filter-grey");
        cfAnchor.title = `No CurseForge link found for ${author.name}.`;
    }
    cfAnchor.classList.add("icon_button");
    cfAnchor.classList.add("inline");
    cfAnchorIcon.classList.add("cf_icon");
    cfAnchorIcon.classList.add("icon_dark"); // for multi-pallete-js
    cfAnchor.appendChild(cfAnchorIcon);
    return cfAnchor;
};
export const createModrinthAuthorIcon = (author) => {
    const mrAnchor = document.createElement("a");
    const mrAnchorIcon = document.createElement("div");
    if (author.mr_slug) {
        mrAnchor.setAttribute("href", getModrinthAuthorUrl(author.mr_slug));
        mrAnchor.setAttribute("target", "_blank");
    }
    else {
        mrAnchor.classList.add("filter-grey");
        mrAnchor.title = `No Modrinth link found for ${author.name}.`;
    }
    mrAnchor.classList.add("icon_button");
    mrAnchor.classList.add("inline");
    mrAnchorIcon.classList.add("mr_icon");
    mrAnchor.appendChild(mrAnchorIcon);
    return mrAnchor;
};
//# sourceMappingURL=platform_links.js.map