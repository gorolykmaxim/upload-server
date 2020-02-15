import {Execution, ExecutionOperationError, ExecutionRepository} from "../domain/execution";
import {Database} from "sqlite";

export const INSERT: string = 'INSERT INTO COMMAND_EXECUTION(START_TIME, COMMAND_NAME, COMMAND_SCRIPT, ERROR, EXIT_CODE, EXIT_SIGNAL, OUTPUT) VALUES (?, ?, ?, ?, ?, ?, ?)';
export const DELETE: string = 'DELETE FROM COMMAND_EXECUTION WHERE START_TIME = ? AND COMMAND_NAME = ?';

export class DatabaseExecutionRepository implements ExecutionRepository {
    constructor(private database: Database) {
    }

    async add(execution: Execution): Promise<void> {
        try {
            await this.database.run(INSERT, execution.startTime, execution.commandName, execution.commandScript, execution.errorMessage, execution.exitCode, execution.exitSignal, execution.outputAsString);
        } catch (e) {
            throw new ExecutionOperationError('save in the database', execution, e);
        }
    }

    async remove(execution: Execution): Promise<void> {
        try {
            await this.database.run(DELETE, execution.startTime, execution.commandName);
        } catch (e) {
            throw new ExecutionOperationError('remove from the database', execution, e);
        }
    }

}
