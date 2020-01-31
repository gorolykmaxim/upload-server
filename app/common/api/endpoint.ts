import {Request, Response} from "express";

/**
 * An HTTP API endpoint, that can process requests, incoming to it.
 */
export interface Endpoint {
    /**
     * Process the incoming request and write a response if necessary.
     *
     * @param req actual request to process
     * @param res response to write data to
     */
    process(req: Request, res: Response): Promise<void>;
}