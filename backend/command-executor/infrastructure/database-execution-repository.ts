import {Execution, ExecutionOperationError, ExecutionRepository, ExecutionsLookupError} from "../domain/execution";
import {Database} from "sqlite";
import {Command} from "../domain/command";

export const SELECT_BY_COMMAND_NAME: string = 'SELECT START_TIME, COMMAND_NAME, COMMAND_SCRIPT, ERROR, EXIT_CODE, EXIT_SIGNAL FROM COMMAND_EXECUTION WHERE COMMAND_NAME = ?';
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

    async findByCommandName(commandName:string): Promise<Array<Execution>> {
        try {
            const rows: Array<any> = await this.database.all(SELECT_BY_COMMAND_NAME, commandName);
            return rows.map(row => new Execution(
                row['START_TIME'],
                new Command(row['COMMAND_NAME'], row['COMMAND_SCRIPT']),
                {exitCode: row['EXIT_CODE'], exitSignal: row['EXIT_SIGNAL']},
                row['ERROR']
            ));
        } catch (e) {
            throw new ExecutionsLookupError(`belong to the command with ID ${commandName}`, e);
        }
    }
}
