import {Request, Response} from "express";
import {APIRequest} from "./request";

/**
 * A request, during processing of which a failure might occur. Such request will catch an error and respond with a
 * corresponding error code and message.
 */
export class FailableRequest implements APIRequest {
    private errorTypeToCode: any = {};

    /**
     * Construct a request.
     *
     * @param actualRequest actual request that might produce an error
     * @param requestIntent intent of the specified request, that will be mentioned in the error message
     */
    constructor(private actualRequest: APIRequest, private requestIntent: string) {
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
            await this.actualRequest.process(req, res);
        } catch (e) {
            const code: number = this.errorTypeToCode[e.constructor.name] ?? 500;
            res.status(code).end(`Failed to ${this.requestIntent}. Reason: ${e.message}`);
        }
    }
}