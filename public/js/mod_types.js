
export { Mod };

class Mod {
    constructor(mod_arr) {
        /**
         * @type {string}
         */
        this.name = mod_arr[0];
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
         * @type {Array}
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
    }
}