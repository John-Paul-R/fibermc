import { getCurseModUrl, getModrinthModUrl, Mod } from "./mod_types.js";

export const createCurseLinkIcon = (modData: Mod) => {
    const cfAnchor = document.createElement("a");
    const cfAnchorIcon = document.createElement("div");
    if (modData.cf_slug) {
        cfAnchor.setAttribute("href", getCurseModUrl(modData.cf_slug));
        cfAnchor.setAttribute("target", "_blank");
    } else {
        cfAnchor.classList.add("filter-grey");
        cfAnchor.title = `No CurseForge link found for ${modData.name}.`;
    }
    cfAnchor.classList.add("icon_button");
    cfAnchorIcon.classList.add("cf_icon");
    cfAnchorIcon.classList.add("icon_dark"); // for multi-pallete-js
    cfAnchor.appendChild(cfAnchorIcon);

    return cfAnchor;
};

export const createModrinthLinkIcon = (modData: Mod) => {
    const mrAnchor = document.createElement("a");
    const mrAnchorIcon = document.createElement("div");
    if (modData.mr_slug) {
        mrAnchor.setAttribute("href", getModrinthModUrl(modData.mr_slug));
        mrAnchor.setAttribute("target", "_blank");
    } else {
        mrAnchor.classList.add("filter-grey");
        mrAnchor.title = `No Modrinth link found for ${modData.name}.`;
    }
    mrAnchor.classList.add("icon_button");
    mrAnchorIcon.classList.add("mr_icon");
    mrAnchor.appendChild(mrAnchorIcon);
    return mrAnchor;
};
