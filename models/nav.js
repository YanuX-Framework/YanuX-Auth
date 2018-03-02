class Nav {
    constructor(title) {
        this.title = title;
        this.page = {};
        this.page[title] = true;
    }
}

module.exports = Nav;