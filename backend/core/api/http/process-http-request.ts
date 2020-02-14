import {Command, CommandError} from "../../command/command";
import {fromEvent, Observable, Subscriber} from "rxjs";
import {Request, Response, response} from "express";
import {takeUntil} from "rxjs/operators";
import {Endpoint} from "../endpoint";
import {ArgumentError} from "common-errors";

/**
 * Process specified HTTP request by executing a command, bind to the corresponding endpoint,
 * processing the output and sending it as a response.
 *
 * Mandatory arguments:
 * - endpoint - endpoint rules, according to which the request should be processed
 * - request - HTTP request to process
 * - response - HTTP response to send a response with
 */
export const PROCESS_HTTP_REQUEST: string = 'process HTTP request';

export class ProcessHttpRequest extends Command {
    readonly mandatoryArgs: Array<string> = ['endpoint', 'request', 'response'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        const request: Request = args.request;
        const response: Response = args.response;
        const endpoint: Endpoint = args.endpoint;
        try {
            const commandToExecute: string = endpoint.commandName;
            const commandArguments: any = endpoint.convertRequestToCommandArguments(request);
            let commandInput: Observable<any>;
            if (endpoint.pipeInRequestBody) {
                commandInput = fromEvent(request, 'data').pipe(takeUntil(fromEvent(request, 'end')));
            } else {
                commandInput = null;
            }
            const responseBody: any = await this.schedule(commandToExecute, commandArguments, commandInput).toPromise();
            if (responseBody) {
                response.send(responseBody);
            }
            response.end();
        } catch (e) {
            let responseCode: number;
            if (e instanceof ArgumentError) {
                responseCode = 400;
            } else if (e instanceof CommandError) {
                responseCode = endpoint.getResponseCodeFor(e.code) ?? 500;
            }
            response.status(responseCode).end(e.message);
        }
        output.complete();
    }
}
