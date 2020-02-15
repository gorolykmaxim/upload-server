import {Execution, ExecutionRepository} from "../domain/execution";
import {Dictionary} from "typescript-collections";

export class InMemoryExecutionRepository implements ExecutionRepository {
    private serializedIdToExecution: Dictionary<string, Execution> = new Dictionary<string, Execution>();

    async add(execution: Execution): Promise<void> {
        this.serializedIdToExecution.setValue(`${execution.commandName}${execution.startTime}`, execution);
    }

    async remove(execution: Execution): Promise<void> {
        this.serializedIdToExecution.remove(`${execution.commandName}${execution.startTime}`);
    }

    async findByCommandName(commandName: string): Promise<Array<Execution>> {
        return this.serializedIdToExecution.values().filter(e => e.commandName === commandName);
    }

    async findByCommandNameAndStartTime(commandName: string, startTime: number): Promise<Execution> {
        return this.serializedIdToExecution.values().filter(e => e.commandName === commandName && e.startTime === startTime)[0];
    }
}
