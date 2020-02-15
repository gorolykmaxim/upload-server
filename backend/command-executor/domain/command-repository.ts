import {Command} from "./command";

export interface CommandRepository {
    findAll(): Array<Command>;
    add(command: Command): void;
}
