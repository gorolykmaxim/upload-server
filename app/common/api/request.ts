import {Request, Response} from "express";

/**
 * An HTTP API request, that can process itself.
 */
export interface APIRequest {
    /**
     * Process the incoming request and write a response if necessary.
     *
     * @param req actual request to process
     * @param res response to write data to
     */
    process(req: Request, res: Response): Promise<void>;
}