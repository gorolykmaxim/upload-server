import {Stats} from "fs";

/**
 * A file system, on which log files are located.
 */
export interface FileSystem {
    /**
     * Get stat attributes of a file, located by the specified path.
     *
     * @param path absolute path to the file
     * @param options additional options
     */
    statAsync(path: string, options?: any): Promise<Stats>;

    /**
     * Read a file, located by the specified path, and return it's contents
     * as a string.
     *
     * @param path absolute path to the file
     * @param options additional options
     */
    readFileAsync(path: string, options?: any): Promise<string>;
}