import {Api} from "../../api";
import {UploaderBoundedContext} from "../domain/uploader-bounded-context";
import {Express, Request, Response} from "express";
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
        this.app.post('/files/', upload.any(), this.logFileOperationAndRespond(this.fileUpload()));
        this.app.post('/files/upload', upload.any(), this.logFileOperationAndRespond(this.fileUpload()));
        this.app.post(`${baseUrl}/file`, upload.any(), this.logFileOperationAndRespond(this.fileUpload()));
    }

    private async resolveFileName(req: Request, file: Express.Multer.File,
                                  callback: (error: (Error | null), filename: string) => void): Promise<void> {
        try {
            if (!req.body.file) {
                throw new Error('"file" is not specified in the request body. It should be an absolute path to a location where the file should be uploaded to');
            }
            const uploadPath: string = this.uploaderBoundedContext.resolveUploadPath(req.body.file);
            await this.uploaderBoundedContext.prepareDirectoryFor(uploadPath);
            callback(null, uploadPath);
        } catch (e) {
            callback(e, null);
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
