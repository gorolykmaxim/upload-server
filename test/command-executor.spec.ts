import {JsonDB} from "node-json-db";
import {Application} from "../backend/application";
import {anything, deepEqual, instance, mock, resetCalls, verify, when} from "ts-mockito";
import * as request from "supertest";
import {Command} from "../backend/command-executor/domain/command";
import {Clock, constantClock} from "clock";
import {Database} from "sqlite";
import {Process, ProcessFactory, ProcessStatus} from "../backend/command-executor/domain/process";
import {EMPTY, from, NEVER, Observable, Subject} from "rxjs";
import {
    DELETE,
    INSERT,
    SELECT_BY_COMMAND_NAME,
    SELECT_BY_COMMAND_NAME_AND_START_TIME
} from "../backend/command-executor/infrastructure/database-execution-repository";
import {constants, EOL} from "os";
import {expect} from "chai";
import {Execution} from "../backend/command-executor/domain/execution";
import {DummyWebSocket, DummyWebSocketServer, mockWebSocketExpress} from "./web-socket";
import {take, takeUntil, toArray} from "rxjs/operators";

describe('command-executor', function () {
    const baseUrl: string = '/api/command-executor';
    const executableCommands: any = {
        'list files': {
            'command': 'ls -lh'
        },
        'kill pc': {
            'command': 'sudo rm -rf /'
        }
    };
    const command: Command = new Command('list files', 'ls -lh');
    const configPath: string = '/command-executor';
    const clock: Clock = constantClock(1324567);
    const output: Array<string> = ['file 1', 'file 2'];
    const outputObservable: Observable<string> = from(output);
    let statusSubject: Subject<ProcessStatus>;
    let jsonDB: JsonDB;
    let processFactory: ProcessFactory;
    let process: Process;
    let database: Database;
    let app: any;
    let wss: DummyWebSocketServer;
    let application: Application;
    beforeEach(async function () {
        statusSubject = new Subject<ProcessStatus>();
        app = mockWebSocketExpress();
        wss = app.dummyWebSocketServer;
        jsonDB = mock(JsonDB);
        processFactory = mock<ProcessFactory>();
        process = mock<Process>();
        database = mock<Database>();
        when(processFactory.create('ls', deepEqual(['-lh']))).thenReturn(instance(process));
        when(process.outputs).thenReturn(outputObservable);
        when(process.status).thenReturn(statusSubject);
        when(jsonDB.getData(configPath))
            .thenThrow(new Error())
            .thenReturn(Object.assign({}, executableCommands));
        application = new Application(app, instance(jsonDB), null, null, clock,
            instance(processFactory), instance(database));
        await application.main();
    });
    afterEach(function () {
        application.server.close();
    });
    it('should initialize command repository if it was not previously initialized', function () {
        // then
        verify(jsonDB.push(configPath, deepEqual({}))).once();
    });
    it('should return list of all executable commands', async function () {
        // given
        const expectedCommands: Array<any> = [
            new Command('list files', 'ls -lh'),
            new Command('kill pc', 'sudo rm -rf /')
        ].map(c => {return {id: c.id, name: c.name, script: c.script}});
        // when
        await request(application.app)
            .get(`${baseUrl}/command`)
            .expect(200, expectedCommands);
    });
    it('should fail to create a new command since commands name is missing', async function () {
        // when
        await request(application.app)
            .post(`${baseUrl}/command`)
            .send({})
            .expect(400);
    });
    it('should fail to create a new command since commands "command" is missing', async function () {
        // when
        await request(application.app)
            .post(`${baseUrl}/command`)
            .send({name: 'monitor processes'})
            .expect(400);
    });
    it('should fail to create a new command since a command with the specified name already exists', async function () {
        // when
        await request(application.app)
            .post(`${baseUrl}/command`)
            .send({name: command.name, script: 'sudo rm -rf /'})
            .expect(409);
    });
    it('should create a new command', async function () {
        // given
        const command: Command = new Command('monitor process', 'top -C');
        // when
        await request(application.app)
            .post(`${baseUrl}/command`)
            .send({name: command.name, script: command.script})
            .expect(201, {id: command.id, name: command.name, script: command.script});
        // then
        verify(jsonDB.push(`${configPath}/${command.name}`, deepEqual({command: command.script}))).once();
    });
    it('should remove command with the specified ID', async function () {
        // when
        await request(application.app)
            .delete(`${baseUrl}/command/${command.id}`)
            .expect(200);
        // then
        verify(jsonDB.push(configPath, deepEqual({'kill pc': {'command': 'sudo rm -rf /'}}))).once();
    });
    it('should not try to remove a command that does not exist', async function () {
        // given
        resetCalls(jsonDB);
        // when
        await request(application.app)
            .delete(`${baseUrl}/command/36475657`)
            .expect(200);
        // then
        verify(jsonDB.push(anything(), anything())).never();
    });
    it('should fail to execute a command since command with the specified ID does not exist', async function () {
        // when
        await request(application.app)
            .post(`${baseUrl}/command/53246374/execution`)
            .expect(404);
    });
    it('should execute the specified command and return information about its execution', async function () {
        // when
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201, {startTime: clock.now(), commandName:  command.name, commandScript: command.script});
    });
    it('should save successfully finished command execution to the database', async function () {
        // given
        const exitCode: number = 0;
        const exitSignal: string = 'SIGINT';
        const databaseSavePromise: Promise<void> = new Promise((resolve, reject) => {
            when(database.run(INSERT, clock.now(), command.name, command.script, null, exitCode, exitSignal, output.join(EOL)))
                .thenCall(() => resolve());
        });
        // when
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        statusSubject.next({exitCode: exitCode, exitSignal: exitSignal});
        // then
        await databaseSavePromise;
    });
    it('should save failed command execution to the database', async function () {
        // given
        const error: Error = new Error('error');
        when(process.outputs).thenReturn(EMPTY);
        // when
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        const statusPromise: Promise<ProcessStatus> = statusSubject.toPromise();
        statusSubject.error(error);
        await expect(statusPromise).rejectedWith(Error);
        // then
        verify(database.run(INSERT, clock.now(), command.name, command.script, error.message, null, null, ''));
    });
    it('should fail to find all executions of a command that does not exist', async function () {
        // when
        await request(application.app)
            .get(`${baseUrl}/command/56234956/execution`)
            .expect(404);
    });
    it('should fail to find all executions of the specified command due to a database error', async function () {
        // given
        when(database.all(SELECT_BY_COMMAND_NAME, command.name)).thenReject(new Error('error'));
        // when
        await request(application.app)
            .get(`${baseUrl}/command/${command.id}/execution`)
            .expect(500);
    });
    it('should find all executions of the specified command and return them in their descending order', async function () {
        // given
        when(process.status).thenReturn(NEVER);
        when(process.outputs).thenReturn(NEVER);
        const executions: Array<Execution> = [];
        for (let i = 1; i < 4; i++) {
            executions.push(new Execution(i, command, {exitCode: 0, exitSignal: "SIGINT"}, null));
        }
        when(database.all(SELECT_BY_COMMAND_NAME, command.name)).thenResolve(
            executions.map(e => {
                    return {
                        'START_TIME': e.startTime,
                        'COMMAND_NAME': e.commandName,
                        'COMMAND_SCRIPT': e.commandScript,
                        'ERROR': e.errorMessage,
                        'EXIT_CODE': e.exitCode,
                        'EXIT_SIGNAL': e.exitSignal
                    };
            })
        );
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        executions.push(new Execution(clock.now(), command));
        executions.sort((a, b) => a.startTime - b.startTime).reverse();
        // when
        await request(application.app)
            .get(`${baseUrl}/command/${command.id}/execution`)
            .expect(200, executions.map(e => {
                return {
                    startTime: e.startTime,
                    commandName: e.commandName,
                    commandScript: e.commandScript,
                    exitCode: e.exitCode,
                    exitSignal: e.exitSignal,
                    errorMessage: e.errorMessage
                };
            }));
    });
    it('should fail to find execution of a command that does not exist', async function () {
        // when
        await request(application.app)
            .get(`${baseUrl}/command/79435626/execution/12345`)
            .expect(404);
    });
    it('should fail to find command execution that does not exist', async function () {
        // when
        await request(application.app)
            .get(`${baseUrl}/command/${command.id}/execution/1`)
            .expect(404);
    });
    it('should fail to find command execution due to a database error', async function () {
        // given
        when(database.get(SELECT_BY_COMMAND_NAME_AND_START_TIME, command.name, 1)).thenReject(new Error('error'));
        // when
        await request(application.app)
            .get(`${baseUrl}/command/${command.id}/execution/1`)
            .expect(500);
    });
    it('should find an active command execution', async function () {
        // given
        when(process.status).thenReturn(NEVER);
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        // when
        await request(application.app)
            .get(`${baseUrl}/command/${command.id}/execution/${clock.now()}`)
            .expect(200, {
                startTime: clock.now(),
                commandName: command.name,
                commandScript: command.script,
                exitCode: null,
                exitSignal: null,
                errorMessage: null,
                output: output
            });
    });
    it('should find an active command execution without splitting its output', async function () {
        // given
        when(process.status).thenReturn(NEVER);
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        // when
        await request(application.app)
            .get(`${baseUrl}/command/${command.id}/execution/${clock.now()}`)
            .query({noSplit: true})
            .expect(200, {
                startTime: clock.now(),
                commandName: command.name,
                commandScript: command.script,
                exitCode: null,
                exitSignal: null,
                errorMessage: null,
                output: output.join(EOL)
            });
    });
    it('should find a complete command execution', async function () {
        // given
        const startTime: number = 1;
        const exitCode: number = 0;
        when(database.get(SELECT_BY_COMMAND_NAME_AND_START_TIME, command.name, startTime)).thenResolve({
            'START_TIME': startTime,
            'COMMAND_NAME': command.name,
            'COMMAND_SCRIPT': command.script,
            'EXIT_CODE': exitCode,
            'EXIT_SIGNAL': null,
            'ERROR': null,
            'OUTPUT': output.join(EOL)
        });
        // when
        await request(application.app)
            .get(`${baseUrl}/command/${command.id}/execution/${startTime}`)
            .expect(200, {
                startTime: startTime,
                commandName: command.name,
                commandScript: command.script,
                exitCode: exitCode,
                exitSignal: null,
                errorMessage: null,
                output: output
            });
    });
    it('should find a complete command execution without splitting its output', async function () {
        // given
        const startTime: number = 1;
        const exitCode: number = 0;
        when(database.get(SELECT_BY_COMMAND_NAME_AND_START_TIME, command.name, startTime)).thenResolve({
            'START_TIME': startTime,
            'COMMAND_NAME': command.name,
            'COMMAND_SCRIPT': command.script,
            'EXIT_CODE': exitCode,
            'EXIT_SIGNAL': null,
            'ERROR': null,
            'OUTPUT': output.join(EOL)
        });
        // when
        await request(application.app)
            .get(`${baseUrl}/command/${command.id}/execution/${startTime}`)
            .query({noSplit: true})
            .expect(200, {
                startTime: startTime,
                commandName: command.name,
                commandScript: command.script,
                exitCode: exitCode,
                exitSignal: null,
                errorMessage: null,
                output: output.join(EOL)
            });
    });
    it('should fail to terminate an execution of a command that does not exist', async function () {
        // when
        await request(application.app)
            .post(`${baseUrl}/command/1239236/execution/${clock.now()}/terminate`)
            .expect(404);
    });
    it('should fail to terminate an execution that is not active right now', async function () {
        // when
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution/${clock.now()}/terminate`)
            .expect(404);
    });
    it('should terminate the execution', async function () {
        // given
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        // when
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution/${clock.now()}/terminate`)
            .expect(200);
        // then
        verify(process.sendSignal(constants.signals.SIGINT)).once();
    });
    it('should fail to halt an execution of a command that does not exist', async function () {
        // when
        await request(application.app)
            .post(`${baseUrl}/command/1239236/execution/${clock.now()}/halt`)
            .expect(404);
    });
    it('should fail to halt an execution that is not active right now', async function () {
        // when
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution/${clock.now()}/halt`)
            .expect(404);
    });
    it('should halt the execution', async function () {
        // given
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        // when
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution/${clock.now()}/halt`)
            .expect(200);
        // then
        verify(process.sendSignal(constants.signals.SIGKILL)).once();
    });
    it('should fail to remove execution of a command that does not exist', async function () {
        // when
        await request(application.app)
            .delete(`${baseUrl}/command/3295236/execution/${clock.now()}`)
            .expect(404);
    });
    it('should fail to remove an execution that does not exist', async function () {
        // when
        await request(application.app)
            .delete(`${baseUrl}/command/${command.id}/execution/${clock.now()}`)
            .expect(404);
    });
    it('should remove active execution', async function () {
        // given
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        // when
        await request(application.app)
            .delete(`${baseUrl}/command/${command.id}/execution/${clock.now()}`)
            .expect(200);
        // then
        verify(process.sendSignal(constants.signals.SIGKILL)).once();
        verify(database.run(DELETE, clock.now(), command.name)).never();
    });
    it('should remove complete execution', async function () {
        // given
        when(database.get(SELECT_BY_COMMAND_NAME_AND_START_TIME, command.name, clock.now())).thenResolve({
            'START_TIME': clock.now(),
            'COMMAND_NAME': command.name,
            'COMMAND_SCRIPT': command.script,
            'EXIT_CODE': 1,
            'EXIT_SIGNAL': null,
            'ERROR': null,
            'OUTPUT': output.join(EOL)
        });
        when(database.run(anything(), anything(), anything())).thenResolve(null);
        // when
        await request(application.app)
            .delete(`${baseUrl}/command/${command.id}/execution/${clock.now()}`)
            .expect(200);
        // then
        verify(database.run(DELETE, clock.now(), command.name)).once();
    });
    it('should receive both status and output change events from both executions', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/event`);
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        statusSubject.next({exitCode: 0, exitSignal: null});
        const messages: Array<any> = await socket.messages.pipe(take(6), toArray()).toPromise();
        // then
        expect(messages).eql([
            {
                commandName: command.name,
                startTime: clock.now(),
                changes: [output[0]],
            },
            {
                commandName: command.name,
                startTime: clock.now(),
                changes: [output[1]],
            },
            {
                commandName: command.name,
                startTime: clock.now(),
                changes: [output[0]],
            },
            {
                commandName: command.name,
                startTime: clock.now(),
                changes: [output[1]],
            },
            {
                commandName: command.name,
                startTime: clock.now(),
                status: {exitCode: 0, exitSignal: null},
                error: null
            },
            {
                commandName: command.name,
                startTime: clock.now(),
                status: {exitCode: 0, exitSignal: null},
                error: null
            }
        ]);
    });
    it('should fail to listen to all events of the specific execution since the specified command does not exist', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/command/:commandId/execution/:startTime`, {}, {commandId: '532467', startTime: clock.now()});
        await socket.closeEvent.toPromise();
        // then
        expect(socket.closeCode).equal(1008);
        expect(socket.closeMessage).equal('Command with ID \'532467\' does not exist');
    });
    it('should fail to listen to all events of the specific execution that is not running right now', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/command/:commandId/execution/:startTime`, {}, {commandId: command.id, startTime: clock.now()});
        await socket.closeEvent.toPromise();
        // then
        expect(socket.closeCode).equal(1008);
        expect(socket.closeMessage).equal('Only executions, that are currently running, can be listened to');
    });
    it('should receive both status and output change events of the specified execution and get connection closed', async function () {
        // given
        const outputSubject: Subject<string> = new Subject<string>();
        when(process.outputs).thenReturn(outputSubject);
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/command/:commandId/execution/:startTime`, {}, {commandId: command.id, startTime: clock.now()});
        setTimeout(() => {
            output.forEach(line => outputSubject.next(line));
            statusSubject.next({exitCode: 0, exitSignal: null});
        }, 1);
        const messages: Array<any> = await socket.messages.pipe(takeUntil(socket.closeEvent), toArray()).toPromise();
        // then
        expect(messages).eql([
            {
                commandName: command.name,
                startTime: clock.now(),
                changes: [output[0]],
            },
            {
                commandName: command.name,
                startTime: clock.now(),
                changes: [output[1]],
            },
            {
                commandName: command.name,
                startTime: clock.now(),
                status: {exitCode: 0, exitSignal: null},
                error: null
            }
        ]);
        expect(socket.closeCode).equal(1000);
        expect(socket.closeMessage).equal('The execution is complete');
    });
    it('should fail to listen to status events of the specific execution since the specified command does not exist', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/command/:commandId/execution/:startTime/status`, {}, {commandId: '1322456234'});
        await socket.closeEvent.toPromise();
        // then
        expect(socket.closeCode).equal(1008);
        expect(socket.closeMessage).equal('Command with ID \'1322456234\' does not exist');
    });
    it('should fail to listen to status events of the specific execution that is not running right now', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/command/:commandId/execution/:startTime/status`, {}, {commandId: command.id, startTime: clock.now()});
        await socket.closeEvent.toPromise();
        // then
        expect(socket.closeCode).equal(1008);
        expect(socket.closeMessage).equal('Only executions, that are currently running, can be listened to');
    });
    it('should receive status change event of the specified execution and get connection closed', async function () {
        // given
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/command/:commandId/execution/:startTime/status`, {}, {commandId: command.id, startTime: clock.now()});
        setTimeout(() => statusSubject.next({exitCode: null, exitSignal: 'SIGKILL'}),1);
        const messages: Array<any> = await socket.messages.pipe(takeUntil(socket.closeEvent), toArray()).toPromise();
        // then
        expect(messages).eql([
            {
                commandName: command.name,
                startTime: clock.now(),
                status: {
                    exitCode: null,
                    exitSignal: 'SIGKILL'
                },
                error: null
            }
        ]);
        expect(socket.closeCode).equal(1000);
        expect(socket.closeMessage).equal('The execution is complete');
    });
    it('should receive status change event about a failure of the specified execution and get connection closed', async function () {
        // given
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/command/:commandId/execution/:startTime/status`, {}, {commandId: command.id, startTime: clock.now()});
        setTimeout(() => statusSubject.error(new Error('error')),1);
        const messages: Array<any> = await socket.messages.pipe(takeUntil(socket.closeEvent), toArray()).toPromise();
        // then
        expect(messages).eql([
            {
                commandName: command.name,
                startTime: clock.now(),
                status: null,
                error: 'error'
            }
        ]);
        expect(socket.closeCode).equal(1000);
        expect(socket.closeMessage).equal('The execution is complete');
    });
    it('should fail to listen to output events of the specific execution since the specified command does not exist', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/command/:commandId/execution/:startTime/output`, {}, {commandId: '532467', startTime: clock.now()});
        await socket.closeEvent.toPromise();
        // then
        expect(socket.closeCode).equal(1008);
        expect(socket.closeMessage).equal('Command with ID \'532467\' does not exist');
    });
    it('should fail to listen to output events of the specific execution that is not running right now', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/command/:commandId/execution/:startTime/status`, {}, {commandId: command.id, startTime: clock.now()});
        await socket.closeEvent.toPromise();
        // then
        expect(socket.closeCode).equal(1008);
        expect(socket.closeMessage).equal('Only executions, that are currently running, can be listened to');
    });
    it('should receive output change events of the specified execution and get connection closed after execution being complete', async function () {
        // given
        const outputSubject: Subject<string> = new Subject<string>();
        when(process.outputs).thenReturn(outputSubject);
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/command/:commandId/execution/:startTime/output`, {}, {commandId: command.id, startTime: clock.now()});
        setTimeout(() => {
            output.forEach(line => outputSubject.next(line));
            statusSubject.next({exitCode: 0, exitSignal: null});
        });
        const messages: Array<any> = await socket.messages.pipe(takeUntil(socket.closeEvent), toArray()).toPromise();
        // then
        expect(messages).eql([
            {
                commandName: command.name,
                startTime: clock.now(),
                changes: [output[0]]
            },
            {
                commandName: command.name,
                startTime: clock.now(),
                changes: [output[1]]
            }
        ]);
    });
    it('should receive complete output of the execution in output events and get connection closed after execution being complete', async function () {
        // given
        const outputSubject: Subject<string> = new Subject<string>();
        when(process.outputs).thenReturn(outputSubject);
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        // when
        output.forEach(line => outputSubject.next(line));
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/command/:commandId/execution/:startTime/output`, {fromStart: 'true'}, {commandId: command.id, startTime: clock.now()});
        setTimeout(() => {
            output.forEach(line => outputSubject.next(line));
            statusSubject.next({exitCode: 0, exitSignal: null});
        });
        const messages: Array<any> = await socket.messages.pipe(takeUntil(socket.closeEvent), toArray()).toPromise();
        // then
        expect(messages).eql([
            {
                commandName: command.name,
                startTime: clock.now(),
                changes: output
            },
            {
                commandName: command.name,
                startTime: clock.now(),
                changes: [output[0]]
            },
            {
                commandName: command.name,
                startTime: clock.now(),
                changes: [output[1]]
            }
        ]);
    });
});
