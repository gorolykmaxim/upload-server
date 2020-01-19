import {CommandFactory} from "../../../app/command-executor/command/command-factory";
import {Command} from "../../../app/command-executor/command/command";
import {CreateChildProcess} from "../../../app/common/child-process";
import {CreateUUID} from "../../../app/common/uuid";
import {Clock, constantClock} from "clock";
import {ChildProcess} from "child_process";
import {instance, mock, when} from "ts-mockito";
import {EOL} from "os";
import {expect} from "chai";
import {CommandExecution} from "../../../app/command-executor/command/command-execution";
import {Readable} from "stream";
import uuid = require("uuid");

describe('Command', function () {
    const name = 'list files';
    const script = 'ls -lh';
    const id = uuid();
    let createUUID: CreateUUID = () => id;
    let clock: Clock = constantClock(125);
    let childProcess: ChildProcess;
    let createChildProcess: CreateChildProcess;
    let factory: CommandFactory;
    beforeEach(function () {
        const childProcessMock = mock<ChildProcess>();
        const readable: Readable = new Readable();
        readable.push(null);
        when(childProcessMock.stdout).thenReturn(readable);
        when(childProcessMock.stderr).thenReturn(readable);
        childProcess = instance(childProcessMock);
        createChildProcess = (binaryPath, args) => {
            return childProcess;
        };
        factory = new CommandFactory(createChildProcess, createUUID, EOL, clock);
    });
    it('should be created with generated ID', function () {
        // when
        const command: Command = factory.create(name, script);
        // then
        expect(command.id).to.equal(id);
    });
    it('should be created with the specified name', function () {
        // when
        const command: Command = factory.create(name, script);
        // then
        expect(command.name).to.equal(name);
    });
    it('should execute specified script while creating an execution', function () {
        // given
        let processCreated: boolean = false;
        createChildProcess = (binaryPath, args) => {
            processCreated = binaryPath === script && args.length === 0;
            return childProcess;
        };
        factory = new CommandFactory(createChildProcess, createUUID, EOL, clock);
        const command: Command = factory.create(name, script);
        // when
        const execution: CommandExecution = command.execute();
        // then
        expect(processCreated).to.be.true;
    });
    it('should set start time of created execution to now', function () {
        // given
        const command: Command = factory.create(name, script);
        // when
        const execution: CommandExecution = command.execute();
        // then
        expect(execution.startTime).to.equal(clock.now());
    });
    it('should set command ID of the created execution to its own', function () {
        // given
        const command: Command = factory.create(name, script);
        // when
        const execution: CommandExecution = command.execute();
        // then
        expect(execution.commandId).to.equal(command.id);
    });
});