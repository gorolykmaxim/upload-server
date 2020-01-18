import {ChildProcess} from "child_process";

/**
 * Factory-method, that creates a child process of the specified binary, while passing specified args to it.
 */
export type CreateChildProcess = (binaryPath: string, args: Array<string>) => ChildProcess;