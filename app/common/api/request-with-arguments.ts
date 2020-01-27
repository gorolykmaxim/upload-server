import {Arguments} from "../arguments";
import {Request, Response} from "express";
import {APIRequest} from "./request";

/**
 * A request, that requires mandatory arguments in order to process itself.
 */
export interface ArgumentsConsumer extends APIRequest {
    /**
     * Set arguments, the request will use during the processing.
     *
     * @param args request arguments
     */
    setArguments(args: Arguments): void;
}

/**
 * A request that checks if all mandatory arguments where send by a client.
 */
export class RequestWithArguments implements APIRequest {
    /**
     * Construct a request.
     *
     * @param actualRequest actual request, processing of which requires arguments
     * @param argumentsSourceName name of a request part, that contains the arguments: either a "query", "body" or "params"
     * @param expectedArguments list of arguments names, which are mandatory
     */
    constructor(private actualRequest: ArgumentsConsumer, private argumentsSourceName: string, private expectedArguments: Array<string>) {
    }

    /**
     * {@inheritDoc}
     */
    async process(req: Request, res: Response): Promise<void> {
        const argumentsSource: any = req;
        const args: Arguments = new Arguments(argumentsSource[this.argumentsSourceName], this.expectedArguments);
        this.actualRequest.setArguments(args);
        await this.actualRequest.process(req, res);
    }
}