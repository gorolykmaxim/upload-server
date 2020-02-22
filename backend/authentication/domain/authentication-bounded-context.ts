import {Credentials, CredentialsRepository} from "./credentials";
import * as expressBasicAuth from "express-basic-auth";

/**
 * Bounded context of an authentication module, that authenticates access to resources, to which it is assigned to.
 */
export class AuthenticationBoundedContext {
    /**
     * Construct a bounded context.
     *
     * @param credentialsRepository repository, that stores current credentials
     */
    constructor(private credentialsRepository: CredentialsRepository) {
    }

    /**
     * Display currently active credentials in the log in such a way, so that it is only accessible on the local host.
     */
    displayCredentialsInLog(): void {
        const credentials: Credentials = this.credentialsRepository.find();
        const attentionGrabber = '#'.repeat(100);
        console.debug(attentionGrabber);
        console.debug('Use following secret as a basic auth credentials to upload files:');
        console.debug(`${credentials.login}:${credentials.password}`);
        console.debug(attentionGrabber);
    }

    /**
     * Return true if the specified login and password match currently used credentials.
     *
     * @param login login to check
     * @param password password to check
     */
    areCredentialsValid(login: string, password: string): boolean {
        const credentials: Credentials = this.credentialsRepository.find();
        return expressBasicAuth.safeCompare(login, credentials.login) && expressBasicAuth.safeCompare(password, credentials.password);
    }
}
