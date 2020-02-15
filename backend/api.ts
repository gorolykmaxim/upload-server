import {Request, Response} from "express";
import {Result, ValidationError, validationResult} from "express-validator";

/**
 * An upload-server API.
 */
export abstract class Api {
    /**
     * Initialize the API.
     *
     * @param baseUrl base URL for all the API's endpoints
     */
    abstract initialize(baseUrl: string): void;

    /**
     * Create a middleware to handle to be placed right after the "express-validator"'s middleware, so that if there
     * are some validation errors, this middleware will immediately respond to the request with a "400" response code
     * and an error messages, that says which arguments are incorrect. Otherwise the middleware will forward
     * the request forward the processing chain.
     */
    protected handleValidationErrors(): (req: Request, res: Response, next: Function) => void {
        return (req, res, next) => {
            const errors: Result<ValidationError>  = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({errors: errors.array()});
            } else {
                next();
            }
        }
    }
}
