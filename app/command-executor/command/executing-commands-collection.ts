import {EntityComparison, InMemoryCollection} from "../../common/collection/in-memory-collection";
import {CommandExecution} from "./command-execution";

/**
 * Comparison of command executions and their IDs.
 * ID of a command execution is an object that has two attributes: "commandId" and "startTime".
 */
export class ExecutingCommandsComparison implements EntityComparison<CommandExecution> {
    /**
     * {@inheritDoc}
     */
    equal(entity: CommandExecution, anotherEntity: CommandExecution): boolean {
        return entity.startTime === anotherEntity.startTime && entity.commandId === anotherEntity.commandId;
    }

    /**
     * {@inheritDoc}
     */
    hasId(entity: CommandExecution, id: any): boolean {
        return entity.startTime === id.startTime && entity.commandId === id.commandId;
    }
}

/**
 * Collection of command executions, that are being executed right now.
 */
export class ExecutingCommandsCollection extends InMemoryCollection<CommandExecution> {
    /**
     * Construct a collection.
     */
    constructor() {
        super(new ExecutingCommandsComparison());
    }
}