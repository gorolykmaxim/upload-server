export class CommandAlreadyExistsError extends Error {
    constructor(commandName: string) {
        super(`Command with name '${commandName}' already exists`);
        Object.setPrototypeOf(this, CommandAlreadyExistsError.prototype);
    }
}
