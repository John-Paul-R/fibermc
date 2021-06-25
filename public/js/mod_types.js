
export { Mod };

class ModOld {
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
class Mod {
    constructor(mod) {
        /**
         * @type {string}
         */
        this.name = mod.name;
        /**
         * @type {string}
         */
        this.curse_slug = mod.curse_slug;
        /**
         * @type {string}
         */
        this.modrinth_slug = mod.modrinth_slug;
        /**
         * @type {string}
         */
        this.summary = mod.summary;
        /**
         * @type {Array<number>}
         */
        this.categories = mod.categories;
        /**
         * @type {Array}
         */
        this.author = mod.author;
        /**
         * @type {number}
         */
        this.downloadCount = mod.download_count;
        /**
         * @type {Date}
         */
        this.dateModified = new Date(mod.date_modified);
        /**
         * @type {string}
         */
        this.versions = mod.versions;
    }

    getLink() {
        if (this.modrinth_slug) {
            return this.getModrinthLink();
        } else {
            return this.getCurseLink();
        }
    }
    getModrinthLink() {
        return `https://modrinth.com/mod/${this.modrinth_slug}`;
    }

    getCurseLink() {
        return `https://www.curseforge.com/minecraft/mc-mods/${this.curse_slug}`;
    }

    getAuthorLink() {
        if (this.modrinth_slug) {
            return this.getModrinthAuthorLink();
        } else {
            return this.getCurseAuthorLink();
        }
        
    }
    getModrinthAuthorLink() {
        return `https://modrinth.com/user/${this.author}`
    }
    getCurseAuthorLink() {
        return `https://www.curseforge.com/members/${this.author}/projects`
    }
}