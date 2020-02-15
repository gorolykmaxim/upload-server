import {Execution, ExecutionRepository} from "../domain/execution";

export class InMemoryExecutionRepository implements ExecutionRepository {
    private serializedIdToExecution: Map<string, Execution> = new Map<string, Execution>();

    async add(execution: Execution): Promise<void> {
        this.serializedIdToExecution.set(`${execution.commandName}${execution.startTime}`, execution);
    }

    async remove(execution: Execution): Promise<void> {
        this.serializedIdToExecution.delete(`${execution.commandName}${execution.startTime}`);
    }
}
