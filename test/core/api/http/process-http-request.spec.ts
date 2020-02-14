import {Response} from "express";
import {HttpEndpoint} from "../../../../backend/core/api/http/http-endpoint";
import {Command, CommandError} from "../../../../backend/core/command/command";
import {CommandExecutor} from "../../../../backend/core/command/command-executor";
import {EventEmitter} from "events";
import {anything, capture, deepEqual, instance, mock, verify, when} from "ts-mockito";
import {ProcessHttpRequest} from "../../../../backend/core/api/http/process-http-request";
import {ArgumentsSource} from "../../../../backend/core/api/endpoint";
import {Argument, ArgumentType} from "../../../../backend/core/api";
import {executeAndReturnOutput} from "../../../common";
import {EMPTY, Observable, of, throwError} from "rxjs";
import { expect } from "chai";

describe('ProcessHttpRequest', function () {
    const commandToExecute: string = 'child command';
    const commandOutput: any = {'a': 15};
    const expectedCommandArgs: any = {'name': 'Tom', 'id': 15};
    let request: any;
    let response: Response;
    let endpoint: HttpEndpoint;
    let command: Command;
    let executor: CommandExecutor;
    let args: any;
    beforeEach(function () {
        endpoint = new HttpEndpoint(null, null, commandToExecute);
        endpoint.addArgument(ArgumentsSource.PARAMS, true, new Argument('id', ArgumentType.number));
        endpoint.addArgument(ArgumentsSource.QUERY, true, new Argument('name', ArgumentType.string));
        endpoint.mapCommandToResponse(2, 403);
        request = new EventEmitter();
        request.query = {'name': 'Tom'};
        request.params = {'id': 15};
        response = mock<Response>();
        executor = mock(CommandExecutor);
        args = {request: request, response: instance(response), endpoint: endpoint};
        when(response.status(anything())).thenReturn(instance(response));
        command = new ProcessHttpRequest();
        command.setExecutor(instance(executor));
    });
    it('should respond with 400 response code to a request with invalid arguments', async function () {
        // given
        delete request.params.id;
        // when
        await executeAndReturnOutput(command, args).toPromise();
        // then
        verify(response.status(400)).once();
        verify(response.end(anything())).once();
    });
    it('should respond with 500 response code to a request processing of which has failed with an unknown error', async function () {
        // given
        when(executor.execute(commandToExecute, deepEqual(expectedCommandArgs), null)).thenReturn(throwError(new CommandError(1, 'error')));
        // when
        await executeAndReturnOutput(command, args).toPromise();
        // then
        verify(response.status(500)).once();
        verify(response.end(anything())).once();
    });
    it('should respond with the specified response code to a request processing of which has failed with the specified error', async function () {
        // given
        when(executor.execute(commandToExecute, deepEqual(expectedCommandArgs), null)).thenReturn(throwError(new CommandError(2, 'error')));
        // when
        await executeAndReturnOutput(command, args).toPromise();
        // then
        verify(response.status(403)).once();
        verify(response.end(anything())).once();
    });
    it('should execute corresponding command and return its response as an HTTP response', async function () {
        // given
        when(executor.execute(commandToExecute, deepEqual(expectedCommandArgs), null)).thenReturn(of(commandOutput));
        // when
        await executeAndReturnOutput(command, args).toPromise();
        // then
        verify(response.send(commandOutput)).once();
        verify(response.end()).once();
    });
    it('should execute corresponding command and end the response without sending body', async function () {
        // given
        when(executor.execute(commandToExecute, deepEqual(expectedCommandArgs), null)).thenReturn(EMPTY);
        // when
        await executeAndReturnOutput(command, args).toPromise();
        // then
        verify(response.send(anything())).never();
        verify(response.end()).once();
    });
    it('should pipe request body inside the command as input', async function () {
        // given
        const requestBodyData: string = 'body data';
        endpoint.pipeInRequestBody = true;
        when(executor.execute(commandToExecute, deepEqual(expectedCommandArgs), anything())).thenReturn(EMPTY);
        // when
        await executeAndReturnOutput(command, args).toPromise();
        // then
        const input: Observable<any> = capture(executor.execute).last()[2];
        const inputData: Promise<any> = input.toPromise();
        request.emit('data', requestBodyData);
        request.emit('end');
        expect(await inputData).equal(requestBodyData);
    });
});
