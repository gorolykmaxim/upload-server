import * as express from "express";
import {LogFileFactory} from "./log-watcher/log/log-file-factory";
import {CreateTail, UnixLogFileFactory} from "./log-watcher/log/unix-log-file-factory";
import {EOL} from "os";
import {LogFilePool} from "./log-watcher/log/log-file-pool";
import {RestrictedLogFilePool} from "./log-watcher/log/restricted-log-file-pool";
import {Collection} from "./common/collection/collection";
import {LogFile} from "./log-watcher/log/log-file";
import {LogFileCollection} from "./log-watcher/log/log-file-collection";
import {LegacyWebSocketAPI} from "./log-watcher/api/legacy-web-socket-api";
import {WatcherFactory} from "./log-watcher/watcher/watcher-factory";
import {MessageFactory} from "./log-watcher/watcher/message-factory";
import {LegacyMessageFactory} from "./log-watcher/watcher/legacy-message-factory";
import {DefaultMessageFactory} from "./log-watcher/watcher/default-message-factory";
import {DefaultWebSocketAPI} from "./log-watcher/api/default-web-socket-api";
import {URL} from "./common/url";
import * as expressWs from "express-ws";
import {CreateUUID} from "./common/uuid";
import {Database, open} from "sqlite";
import {AllowedLogsCollection} from "./log-watcher/log/allowed-logs-collection";
import {FindAllowedLogs} from "./log-watcher/api/rest/find-allowed-logs";
import {GetLogSize} from "./log-watcher/api/rest/get-log-size";
import {GetLogContent} from "./log-watcher/api/rest/get-log-content";
import {AllowLog} from "./log-watcher/api/rest/allow-log";
import {DisallowLog} from "./log-watcher/api/rest/disallow-log";
import {ApplicationServer} from "./common/api/application-server";
import bodyParser = require("body-parser");
import Bluebird = require("bluebird");
import uuid = require("uuid");
import {CommandFactory} from "./command-executor/command/command-factory";
import {CreateChildProcess} from "./common/child-process";
import {spawn} from "child_process";
import systemClock, {Clock} from "clock";
import {Command} from "./command-executor/command/command";
import {CommandCollection} from "./command-executor/command/command-collection";
import {CommandExecution} from "./command-executor/command/command-execution";
import {ExecutingCommandsCollection} from "./command-executor/command/executing-commands-collection";
import {ExecutedCommandsCollection} from "./command-executor/command/executed-commands-collection";
import {CommandURL} from "./command-executor/api/command-url";
import {CommandExecutionURL} from "./command-executor/api/command-execution-url";
import {FindAllCommands} from "./command-executor/api/rest/command/find-all-commands";
import {CreateCommand} from "./command-executor/api/rest/command/create-command";
import {RemoveCommand} from "./command-executor/api/rest/command/remove-command";
import {FindExecutionsOfCommand} from "./command-executor/api/rest/command/execution/find-executions-of-command";
import {CreateExecutionOfCommand} from "./command-executor/api/rest/command/execution/create-execution-of-command";
import {Events} from "./common/events";
import {FindCommandExecution} from "./command-executor/api/rest/command/execution/find-command-execution";
import {RemoveCommandExecution} from "./command-executor/api/rest/command/execution/remove-command-execution";
import {TerminateCommandExecution} from "./command-executor/api/rest/command/execution/terminate-command-execution";

async function main(): Promise<void> {
    const db: Database = await open('../../upload-server.db');
    // TODO: remove force: 'last'
    await db.migrate({force: 'last', migrationsPath: '../../migrations'});

    const Tail = require('nodejs-tail');
    const fileSystem = Bluebird.promisifyAll(require('fs'));
    const createChildProcess: CreateChildProcess = (binaryPath, args) => spawn(binaryPath, args);
    const createTail: CreateTail = absolutePathToFile => new Tail(absolutePathToFile, {usePolling: true});
    const createUUID: CreateUUID = () => uuid();
    const clock: Clock = systemClock;

    const logFileFactory: LogFileFactory = new UnixLogFileFactory(createTail, fileSystem, EOL);
    const allowedLogs: Collection<string> = new AllowedLogsCollection(db);
    const logFiles: Collection<LogFile> = new LogFileCollection();
    const logFilePool: LogFilePool = new RestrictedLogFilePool(allowedLogs, logFiles, logFileFactory);

    const commandFactory: CommandFactory = new CommandFactory(createChildProcess, createUUID, EOL, clock);
    const commands: Collection<Command> = new CommandCollection(commandFactory, db);
    const activeExecutions: Collection<CommandExecution> = new ExecutingCommandsCollection();
    const completeExecutions: Collection<CommandExecution> = new ExecutedCommandsCollection(db);
    const events: Events = new Events();

    const application: any = express();
    const applicationServer: ApplicationServer = new ApplicationServer(application);
    expressWs(application);
    application.use(bodyParser.json());

    const legacyMessageFactory: MessageFactory = new LegacyMessageFactory();
    const legacyWatcherFactory: WatcherFactory = new WatcherFactory(createUUID, legacyMessageFactory);
    applicationServer.webSocket(URL.createNew(''), new LegacyWebSocketAPI(logFilePool, legacyWatcherFactory));

    const baseAPIURL: URL = URL.createNew('api');
    const baseLogWatcherAPIURL: URL = baseAPIURL.append('log-watcher');

    const messageFactory: MessageFactory = new DefaultMessageFactory();
    const watcherFactory: WatcherFactory = new WatcherFactory(createUUID, messageFactory);
    applicationServer.webSocket(baseLogWatcherAPIURL.append('log'), new DefaultWebSocketAPI(logFilePool, watcherFactory));

    const logURL: URL = baseLogWatcherAPIURL.append('log');
    const logSizeURL: URL = logURL.append('size');
    const logContentURL: URL = logURL.append('content');
    applicationServer.get(logURL, FindAllowedLogs.create(allowedLogs));
    applicationServer.get(logSizeURL, GetLogSize.create(logFilePool));
    applicationServer.get(logContentURL, GetLogContent.create(logFilePool));
    applicationServer.post(logURL, AllowLog.create(allowedLogs, fileSystem));
    applicationServer.delete(logURL, DisallowLog.create(allowedLogs));

    const baseCommandExecutorAPIURL: URL = baseAPIURL.append('command-executor');
    const allCommandsURL: CommandURL = CommandURL.allCommands(baseCommandExecutorAPIURL);
    const singleCommandURL: CommandURL = CommandURL.singleCommand(baseCommandExecutorAPIURL);
    const allExecutionsURL: CommandExecutionURL = CommandExecutionURL.allExecutions(singleCommandURL);
    const singleExecutionURL: CommandExecutionURL = CommandExecutionURL.singleExecution(singleCommandURL);
    const terminateExecutionURL: CommandExecutionURL = CommandExecutionURL.terminateExecution(singleCommandURL);
    const haltExecutionURL: CommandExecutionURL = CommandExecutionURL.haltExecution(singleCommandURL);
    applicationServer.get(allCommandsURL, FindAllCommands.create(commands));
    applicationServer.post(allCommandsURL, CreateCommand.create(commandFactory, commands));
    applicationServer.delete(singleCommandURL, RemoveCommand.create(commands));
    applicationServer.get(allExecutionsURL, FindExecutionsOfCommand.create(activeExecutions, completeExecutions));
    applicationServer.post(allExecutionsURL, CreateExecutionOfCommand.create(commands, activeExecutions, completeExecutions, events));
    applicationServer.get(singleExecutionURL, FindCommandExecution.create(activeExecutions, completeExecutions));
    applicationServer.delete(singleExecutionURL, RemoveCommandExecution.create(activeExecutions, completeExecutions));
    applicationServer.post(terminateExecutionURL, TerminateCommandExecution.createTerminate(activeExecutions));
    applicationServer.post(haltExecutionURL, TerminateCommandExecution.createHalt(activeExecutions));

    application.listen(8080, () => {console.log('Listening on 8080...')});
}

main();