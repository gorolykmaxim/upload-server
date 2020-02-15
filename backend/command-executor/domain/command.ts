import getUuidByString = require("uuid-by-string");

export class Command {
    readonly id: string;

    constructor(readonly name: string, readonly command: string) {
        this.id = getUuidByString(name);
    }
}
