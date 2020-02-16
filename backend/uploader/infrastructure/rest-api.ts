import {Api} from "../../api";
import {UploaderBoundedContext, UploadPathOutsideUploadDirectoryError} from "../domain/uploader-bounded-context";
import {Express, Request, Response} from "express";
import {fromEvent, Observable} from "rxjs";
import {take, takeUntil} from "rxjs/operators";
import {body, query} from "express-validator";
import multer = require("multer");

export class RestApi extends Api {
    constructor(private uploadDirectory: string, private app: Express, private uploaderBoundedContext: UploaderBoundedContext) {
        super();
    }

    initialize(baseUrl: string): void {
        const that = this;
        const storage = multer.diskStorage({
            destination: this.uploadDirectory,
            filename(req: Request, file: Express.Multer.File, callback: (error: (Error | null), filename: string) => void): void {
                that.resolveFileName(req, file, callback);
            }
        });
        const upload = multer({storage: storage});
        this.app.post('/files/', upload.any(), this.handleRawBodyUpload(), this.logFileOperationAndRespond(this.fileUpload()));
        this.app.post('/files/upload', upload.any(), this.handleRawBodyUpload(), this.logFileOperationAndRespond(this.fileUpload()));
        this.app.post(`${baseUrl}/file`, upload.any(), this.handleRawBodyUpload(), this.logFileOperationAndRespond(this.fileUpload()));
        this.app.post('/files/move', [query('old_file').isString().notEmpty(), query('file').isString().notEmpty()], this.handleValidationErrors(), async (req: Request, res: Response, next: Function) => {
            try {
                await this.uploaderBoundedContext.moveFile(req.query.old_file, req.query.file);
                next();
            } catch (e) {
                res.status(e instanceof UploadPathOutsideUploadDirectoryError ? 403 : 500).send(e.message);
            }
        }, this.logFileOperationAndRespond(req => `File moved from ${req.query.old_file} to ${req.query.file}`));
        this.app.put(`${baseUrl}/file`, [body('oldPath').isString().notEmpty(), body('newPath').isString().notEmpty()], this.handleValidationErrors(), async (req: Request, res: Response, next: Function) => {
            try {
                await this.uploaderBoundedContext.moveFile(req.body.oldPath, req.body.newPath);
                next();
            } catch (e) {
                res.status(e instanceof UploadPathOutsideUploadDirectoryError ? 403 : 500).send(e.message);
            }
        }, this.logFileOperationAndRespond(req => `File moved from ${req.body.oldPath} to ${req.body.newPath}`));
        this.app.post('/files/delete', query('file').isString().notEmpty(), this.handleValidationErrors(), async (req: Request, res: Response, next: Function) => {
            try {
                await this.uploaderBoundedContext.removeFile(req.query.file);
                next();
            } catch (e) {
                res.status(e instanceof UploadPathOutsideUploadDirectoryError ? 403 : 500).send(e.message);
            }
        }, this.logFileOperationAndRespond(req => `File removed: ${req.query.file}`));
        this.app.delete(`${baseUrl}/file`, query('name').isString().notEmpty(), this.handleValidationErrors(), async (req: Request, res: Response, next: Function) => {
            try {
                await this.uploaderBoundedContext.removeFile(req.query.name);
                next();
            } catch (e) {
                res.status(e instanceof UploadPathOutsideUploadDirectoryError ? 403 : 500).send(e.message);
            }
        }, this.logFileOperationAndRespond(req => `File removed: ${req.query.name}`));
    }

    private async resolveFileName(req: Request, file: Express.Multer.File,
                                  callback: (error: (Error | null), filename: string) => void): Promise<void> {
        try {
            if (!req.body.file) {
                throw new MissingUploadPathError('file', 'body');
            }
            const uploadPath: string = this.uploaderBoundedContext.resolveUploadPath(req.body.file);
            await this.uploaderBoundedContext.prepareDirectoryFor(uploadPath);
            callback(null, uploadPath);
        } catch (e) {
            callback(e, null);
        }
    }

    private handleRawBodyUpload(): (req: any, res: Response, next: Function) => Promise<void> {
        return async (req, res, next) => {
            if (req.header('content-type').indexOf('multipart/form-data') < 0) {
                try {
                    if (!req.query.name) {
                        throw new MissingUploadPathError('name', 'query');
                    }
                    const requestBodyEnd: Observable<any> = fromEvent(req, 'end').pipe(take(1));
                    const requestBody: Observable<string> = fromEvent(req, 'data').pipe(takeUntil<string>(requestBodyEnd));
                    const uploadPath: string = await this.uploaderBoundedContext.uploadFile(req.query.name, requestBody);
                    req.files = [{path: uploadPath}];
                    next();
                } catch (e) {
                    let code: number = 500;
                    if (e instanceof MissingUploadPathError) {
                        code = 400;
                    } else if (e instanceof UploadPathOutsideUploadDirectoryError) {
                        code = 403;
                    }
                    res.status(code).send(e.message);
                }
            } else {
                next();
            }
        }
    }

    private logFileOperationAndRespond(getOperationDescription: (req: any) => string): (req: Request, res: Response) => void {
        return (req, res) => {
            const date: Date = new Date();
            console.info(`[${date.toISOString()}] - ${getOperationDescription(req)}`);
            res.end();
        }
    }

    private fileUpload(): (req: any) => string {
        return (req) => `File uploaded: ${req.files[0].path}`;
    }
}

class MissingUploadPathError extends Error {
    constructor(attributeName: string, requestPath: string) {
        super(`"${attributeName}" is not specified in the request ${requestPath}. It should be an absolute path to a location where the file should be uploaded to.`);
        Object.setPrototypeOf(this, MissingUploadPathError.prototype);
    }
}
