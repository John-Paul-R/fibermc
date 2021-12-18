export { Mod };

class Mod {
    name: string;
    slug: string;
    summary: string;
    categories: Array<number>;
    author: Array<Author>;
    downloadCount: number;
    dateModified: Date;
    latestMCVersion: string;
    // Sorting props:
    s_name: string;
    s_latestMCVersion: number;
    s_dateModified: number;
    constructor(mod_arr: any[]) {
        /**
         * @type {string}
         */
        this.name = formatName(mod_arr[0]);
        /**
         * @type {string}
         */
        this.slug = mod_arr[1];
        /**
         * @type {string}
         */
        this.summary = mod_arr[2];
        /**
         * @type {Array<number>}
         */
        this.categories = mod_arr[3];
        /**
         * @type {Array<Author>}
         */
        this.author = mod_arr[4][0];
        /**
         * @type {number}
         */
        this.downloadCount = mod_arr[5];
        /**
         * @type {Date}
         */
        this.dateModified = new Date(mod_arr[6]);
        /**
         * @type {string}
         */
        this.latestMCVersion = mod_arr[7];

        // Sorting props:

        this.s_name = sortableName(this.name);
        this.s_latestMCVersion = versionOrd(this.latestMCVersion);
        this.s_dateModified = dateOrd(this.dateModified);
    }
}

export type Author = {
    id: string; // Guid
    mr_slug: string | null;
    cf_slug: string | null;
    name: string;
};

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
