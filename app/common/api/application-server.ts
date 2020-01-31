import {URL} from "../url";
import {Endpoint} from "./endpoint";
import {Application} from "express";

/**
 * Decorator of a {@link Application}, that behave just like it, but understands such entities like {@link URL}
 * and {@link Endpoint}.
 */
export class ApplicationServer {
    /**
     * Construct an application server.
     *
     * @param application application to decorate
     */
    constructor(private application: Application) {
    }

    /**
     * Register specified endpoint to process GET HTTP requests, coming to the specified URL.
     *
     * @param url URL to listen to requests on
     * @param endpoint endpoint to register
     */
    get(url: URL, endpoint: Endpoint): void {
        this.application.get(url.value, endpoint.process.bind(endpoint));
    }

    /**
     * Register specified endpoint to process POST HTTP requests, coming to the specified URL.
     *
     * @param url URL to listen to requests on
     * @param endpoint endpoint to register
     */
    post(url: URL, endpoint: Endpoint): void {
        this.application.post(url.value, endpoint.process.bind(endpoint));
    }

    /**
     * Register specified endpoint to process PUT HTTP requests, coming to the specified URL.
     *
     * @param url URL to listen to requests on
     * @param endpoint endpoint to register
     */
    put(url: URL, endpoint: Endpoint): void {
        this.application.put(url.value, endpoint.process.bind(endpoint));
    }

    /**
     * Register specified endpoint to process DELETE HTTP requests, coming to the specified URL.
     *
     * @param url URL to listen to requests on
     * @param endpoint endpoint to register
     */
    delete(url: URL, endpoint: Endpoint): void {
        this.application.delete(url.value, endpoint.process.bind(endpoint));
    }
}