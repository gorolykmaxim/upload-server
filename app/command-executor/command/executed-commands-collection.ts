import {DatabaseCollection, EntityMapping} from "../../common/collection/database-collection";
import {CommandExecution, ExecutionStatus} from "./command-execution";
import { Database } from "sqlite";

const statusToInt: any = {};
statusToInt[ExecutionStatus.finished] = 0;
statusToInt[ExecutionStatus.failed] = 1;
const intToStatus: Array<ExecutionStatus> = [ExecutionStatus.finished, ExecutionStatus.failed];

/**
 * Mapping of a command execution.
 */
export class CommandExecutionMapping implements EntityMapping<CommandExecution> {

    /**
     * {@inheritDoc}
     */
    deserialize(entity: any): CommandExecution {
        const eol: string = entity['END_OF_LINE'];
        const splitOutput: Array<string> = entity['OUTPUT'].split(eol);
        const status: ExecutionStatus = intToStatus[entity['STATUS']];
        return CommandExecution.finished(entity['COMMAND_ID'], entity['START_TIME'], splitOutput, status, eol);
    }

    /**
     * {@inheritDoc}
     */
    serialize(entity: CommandExecution): any {
        return {
            'COMMAND_ID': entity.commandId,
            'START_TIME': entity.startTime,
            'STATUS': statusToInt[entity.getStatus()],
            'END_OF_LINE': entity.eol,
            'OUTPUT': entity.getOutputAsString()
        };
    }
}

/**
 * Collection of command executions, that were finished.
 */
export class ExecutedCommandsCollection extends DatabaseCollection<CommandExecution> {
    /**
     * Construct a collection.
     *
     * @param database database where the collection will store command executions
     */
    constructor(database: Database) {
        super(new CommandExecutionMapping(), 'COMMAND_EXECUTION', database);
    }
}