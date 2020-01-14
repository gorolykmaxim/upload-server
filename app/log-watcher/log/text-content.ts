/**
 * Content of a text log file.
 */
export class TextContent {
    public content: string;

    /**
     * Construct content.
     *
     * @param rawContent raw content of a text file, that may be a string or a buffer
     * @param eol end-of-line separator used in this content
     */
    constructor(rawContent: any, private eol: string) {
        this.content = rawContent.toString();
    }

    /**
     * Return all the lines of the text content.
     */
    getLines(): Array<string> {
        const lines = this.content.split(this.eol);
        const indexOfLastLine = lines.length - 1;
        if (lines[indexOfLastLine] === '') {
            lines.splice(indexOfLastLine, 1);
        }
        return lines;
    }
}