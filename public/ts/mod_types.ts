export { Mod };

export interface BaseMod {
    id: string;
    name: string;
    mr_slug: string | null;
    cf_slug: string | null;
    summary: string;
    categories: number[];
    authors: Author[];
    dateReleased: string;
    dateModified: string;
    downloadCount: number;
    mc_versions: string[];
}

interface Mod extends BaseMod {
    s_name: string;
    s_latestMCVersion: number;
    s_dateModified: number;
    latestMCVersion: string;
    s_author: string;
}

export function baseModToMod(mod: BaseMod): Mod {
    return {
        ...mod,
        name: formatName(mod.name),
        s_name: sortableName(mod.name),
        s_author: searchableAuthors(mod.authors),
        s_latestMCVersion: versionOrd(mod.mc_versions.at(-1)),
        s_dateModified: dateOrd(mod.dateModified),
        latestMCVersion: mod.mc_versions.at(-1),
    };
}

export type Author = {
    id: string; // Guid
    mr_slug: string | null;
    cf_slug: string | null;
    name: string;
};

const searchableAuthors = (authors: Author[]) =>
    authors.map((author) => author.name.toLowerCase()).join(",");

/**
 * @param {string} name
 */
function formatName(name: string) {
    return name
        .trim()
        .replace(
            /[\[({][^\[{(\n]*(?<![a-z])(fabric)(?![a-z])[^)\]}\n]*[)\]}]/gi,
            ""
        )
        .trim();
}
/**
 * @param {string} name
 */
function sortableName(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}
/**
 * @param {string} vers
 */
function versionOrd(vers: string) {
    if (!vers) {
        return -1;
    }
    const nums = vers.split(".");
    let weight = 100000;
    let out = 0;
    for (const x of nums) {
        let strNum = x.replace(/[^0-9]/g, "");
        out += parseFloat(strNum) * weight;
        weight /= 100;
    }
    if (nums[nums.length - 1].endsWith("-Snapshot")) {
        out -= 1;
    }
    if (Number.isNaN(out)) {
        out = -1;
    }
    return out;
}

function dateOrd(date: string | number | Date) {
    return new Date(date).valueOf();
}

export const getModrinthModUrl = (slug: string) =>
    `https://modrinth.com/mod/${slug}`;

export const getCurseModUrl = (slug: string) =>
    `https://www.curseforge.com/minecraft/mc-mods/${slug}`;

export const getModrinthAuthorUrl = (slug: string) =>
    `https://modrinth.com/user/${slug}`;

export const getCurseAuthorUrl = (slug: string) =>
    `https://www.curseforge.com/members/${slug}/projects`;
