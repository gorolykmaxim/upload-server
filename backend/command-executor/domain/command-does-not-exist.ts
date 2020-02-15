export class CommandDoesNotExist extends Error {
    constructor(id: string) {
        super(`Command with ID '${id}' does not exist`);
        Object.setPrototypeOf(this, CommandDoesNotExist.prototype);
    }
}
