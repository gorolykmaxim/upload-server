import {Command} from "./command";

export interface CommandRepository {
    findAll(): Array<Command>;
    findById(id: string): Command;
    add(command: Command): void;
    remove(command: Command): void;
}
