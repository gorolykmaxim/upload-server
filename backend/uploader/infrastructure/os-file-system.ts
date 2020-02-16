import {FileSystem} from "../domain/file-system";
import {Observable} from "rxjs";
import {createWriteStream, promises, WriteStream} from "fs";

export class OsFileSystem implements FileSystem {
    async ensureDirectoryExists(path: string): Promise<void> {
        await promises.mkdir(path, {recursive: true});
    }

    writeToFile(path: string, data: Observable<string>): Promise<void> {
        return new Promise((resolve, reject) => {
            const stream: WriteStream = createWriteStream(path);
            data.subscribe(chunk => stream.write(chunk), e => {}, () => {
                stream.end();
                resolve();
            });
            stream.on('error', reject);
        });
    }

    async move(oldPath: string, newPath: string): Promise<void> {
        await promises.rename(oldPath, newPath);
    }

}
