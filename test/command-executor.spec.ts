import {JsonDB} from "node-json-db";
import {Application} from "../backend/application";
import {anything, deepEqual, instance, mock, resetCalls, verify, when} from "ts-mockito";
import * as request from "supertest";
import {Command} from "../backend/command-executor/domain/command";
import {Clock, constantClock} from "clock";
import {Database} from "sqlite";
import {Process, ProcessFactory, ProcessStatus} from "../backend/command-executor/domain/process";
import {EMPTY, from, Observable, Subject} from "rxjs";
import {INSERT} from "../backend/command-executor/infrastructure/database-execution-repository";
import {EOL} from "os";
import { expect } from "chai";

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
    let application: Application;
    beforeEach(async function () {
        statusSubject = new Subject<ProcessStatus>();
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
        application = new Application(null, instance(jsonDB), null, null, clock,
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
        ].map(c => {return {id: c.id, name: c.name, command: c.command}});
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
            .send({name: command.name, command: 'sudo rm -rf /'})
            .expect(409);
    });
    it('should create a new command', async function () {
        // given
        const command: Command = new Command('monitor process', 'top -C');
        // when
        await request(application.app)
            .post(`${baseUrl}/command`)
            .send({name: command.name, command: command.command})
            .expect(201, {id: command.id, name: command.name, command: command.command});
        // then
        verify(jsonDB.push(`${configPath}/${command.name}`, deepEqual({command: command.command}))).once();
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
            .expect(201, {startTime: clock.now(), commandName:  command.name, commandScript: command.command});
    });
    it('should save successfully finished command execution to the database', async function () {
        // given
        const exitCode: number = 0;
        const exitSignal: string = 'SIGINT';
        // when
        await request(application.app)
            .post(`${baseUrl}/command/${command.id}/execution`)
            .expect(201);
        const statusPromise: Promise<ProcessStatus> = statusSubject.toPromise();
        statusSubject.next({exitCode: exitCode, exitSignal: exitSignal});
        statusSubject.complete();
        await statusPromise;
        // then
        verify(database.run(INSERT, clock.now(), command.name, command.command, null, exitCode, exitSignal, output.join(EOL))).once();
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
        verify(database.run(INSERT, clock.now(), command.name, command.command, error.message, null, null, ''));
    });
});
