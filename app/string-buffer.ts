/**
 * Buffer of string data, being read.
 * The buffer always reads only complete string lines of data, while buffering those lines, that were
 * not completed with an end-of-line separator, for the next read.
 */
export class StringBuffer {
    private data: string = null;

    /**
     * Construct a buffer.
     *
     * @param eol end-of-line separator, that will be used in content, that will be read with this buffer
     */
    constructor(private eol: string) {
    }

    /**
     * Read finished string lines from the specified data. If a line is not finished - it will get buffered until
     * the next data read, where it is most likely to be completed with a missing part.
     *
     * @param data chunk of data to be read in lines
     */
    readLines(data: string): Array<string> {
        if (this.data != null) {
            // Non-empty buffer means, that last chunk of content, had last line
            // interrupted. This means that the first line of current chunk is the continuation of that line.
            data = this.data + data;
        }
        const lines: Array<string> = data.split(this.eol);
        const lastLine: string = lines.pop();
        if (lastLine !== '') {
            // We've just split a string by line-ending delimiter. That string didn't end with a line-ending symbol,
            // it means that line was not complete. We will not emit that line and save it until next time, since next
            // time we will receive the rest of that line.
            this.data = lastLine;
        }
        return lines;
    }

    /**
     * Clear the buffer.
     */
    clear() {
        this.data = null;
    }

    /**
     * {@inheritDoc}
     */
    toString() {
        return `Buffer{data=${this.data}, eol=${this.eol}}`;
    }
}