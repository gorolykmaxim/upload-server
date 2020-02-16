import {Command, CommandRepository} from "../domain/command";
import {JsonDB} from "node-json-db";

export class ConfigCommandRepository implements CommandRepository {
    private static readonly COMMANDS_PATH: string = '/command-executor';

    constructor(private jsonDb: JsonDB) {
    }

    initialize(): void {
        try {
            this.jsonDb.getData(ConfigCommandRepository.COMMANDS_PATH);
        } catch (e) {
            this.jsonDb.push(ConfigCommandRepository.COMMANDS_PATH, {});
        }
    }

    findAll(): Array<Command> {
        const commands: Array<Command> = [];
        const configCommands: any = this.jsonDb.getData(ConfigCommandRepository.COMMANDS_PATH);
        for (let name in configCommands) {
            commands.push(new Command(name, configCommands[name].command));
        }
        return commands;
    }

    add(command: Command): void {
        this.jsonDb.push(`${ConfigCommandRepository.COMMANDS_PATH}/${command.name}`, {command: command.script});
    }

    findById(id: string): Command {
        return this.findAll().filter(c => c.id === id)[0];
    }

    remove(command: Command): void {
        const configCommands: any = this.jsonDb.getData(ConfigCommandRepository.COMMANDS_PATH);
        delete configCommands[command.name];
        this.jsonDb.push(ConfigCommandRepository.COMMANDS_PATH, configCommands);
    }
}
