import {Request, Response} from "express";
import {Endpoint} from "./endpoint";

/**
 * An endpoint, during processing of which a failure might occur. Such endpoint will catch an error and respond with a
 * corresponding error code and message.
 */
export class FailableEndpoint implements Endpoint {
    private errorTypeToCode: any = {};

    /**
     * Construct a endpoint.
     *
     * @param actualEndpoint actual endpoint that might produce an error
     * @param endpointIntent intent of the specified endpoint, that will be mentioned in the error message
     * @param actualDisposableEndpoint actual endpoint, that have to be disposed after the execution
     */
    constructor(private actualEndpoint: Endpoint, private endpointIntent: string,
                private actualDisposableEndpoint?: DisposableEndpoint) {
    }

    /**
     * Specify what HTTP response code to use when an error with the specified type happens.
     *
     * @param code HTTP response code to return
     * @param type type of error
     */
    respondWithCodeOnErrorType(code: number, type: any) {
        this.errorTypeToCode[type.name] = code;
    }

    /**
     * {@inheritDoc}
     */
    async process(req: Request, res: Response): Promise<void> {
        try {
            await this.actualEndpoint.process(req, res);
        } catch (e) {
            const code: number = this.errorTypeToCode[e.constructor.name] ?? 500;
            res.status(code).end(`Failed to ${this.endpointIntent}. Reason: ${e.message}`);
        } finally {
            await this.actualDisposableEndpoint?.dispose();
        }
    }
}

/**
 * An endpoint that has resources that should be disposed regardless of the actual request processing being successful
 * or not.
 */
export interface DisposableEndpoint {
    /**
     * Dispose resources, used by the endpoint.
     */
    dispose(): Promise<void>;
}