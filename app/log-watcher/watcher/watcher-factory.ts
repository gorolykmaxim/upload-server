import {MessageFactory} from "./message-factory";
import {Watcher} from "./watcher";
import {LogFileCollection} from "../log/log-file-collection";
import WebSocket = require("ws");

/**
 * Factory-method that returns a new UUID in as a string.
 */
export type CreateUUID = () => string;

/**
 * Factory of {@link Watcher}.
 */
export class WatcherFactory {
    /**
     * Construct a factory.
     *
     * @param createUUID factory-method to create a new UUID
     * @param messageFactory factory, that will be used to create messages, that will be sent from watchers to API
     * clients
     */
    constructor(private createUUID: CreateUUID, private messageFactory: MessageFactory) {
    }

    /**
     * Create a watcher, that will represent an API client, connected via specified connection.
     *
     * @param connection connection of the API client, that corresponds to the created watcher
     */
    create(connection: WebSocket): Watcher {
        return new Watcher(this.createUUID(), connection, this.messageFactory, new LogFileCollection());
    }
}