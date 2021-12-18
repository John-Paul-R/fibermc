export function baseModToMod(mod) {
    return {
        ...mod,
        s_name: sortableName(mod.name),
        s_latestMCVersion: versionOrd(mod.latestMCVersion),
        s_dateModified: dateOrd(mod.dateModified),
    };
}
/**
 * @param {string} name
 */
function formatName(name) {
    return name
        .trim()
        .replace(/[\[({][^\[{(\n]*(?<![a-z])(fabric)(?![a-z])[^)\]}\n]*[)\]}]/gi, "")
        .trim();
}
/**
 * @param {string} name
 */
function sortableName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}
/**
 * @param {string} vers
 */
function versionOrd(vers) {
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
function dateOrd(date) {
    return new Date(date).valueOf();
}
export const getModrinthModUrl = (slug) => `https://modrinth.com/mod/${slug}`;
export const getCurseModUrl = (slug) => `https://www.curseforge.com/minecraft/mc-mods/${slug}`;
export const getModrinthAuthorUrl = (slug) => `https://modrinth.com/user/${slug}`;
export const getCurseAuthorUrl = (slug) => `https://www.curseforge.com/members/${slug}/projects`;
//# sourceMappingURL=mod_types.js.map