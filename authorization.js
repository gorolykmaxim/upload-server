const DATA_LOCATION = '/authorization';
const CREDENTIALS_LOCATION = `${DATA_LOCATION}/credentials`;

class Credentials {
    static generate(md5) {
        return new Credentials({login: md5(Date.now() + 1000), password: md5(Date.now() - 1000)});
    }
    constructor(credentials) {
        if (!credentials.login) {
            throw 'login not specified';
        }
        if (!credentials.password) {
            throw 'password not specified';
        }
        this.login = credentials.login;
        this.password = credentials.password;
    }
    equals(basicAuth, login, password) {
        return basicAuth.safeCompare(login, this.login) & basicAuth.safeCompare(password, this.password);
    }
    toString() {
        return `${this.login}:${this.password}`;
    }
}

class Authorization {
    constructor(basicAuth, db, logger, md5) {
        this.basicAuth = basicAuth;
        this.db = db;
        this.logger = logger;
        this.md5 = md5;
    }
    serveOn(app, url) {
        const credentials = this.initializeCredentials();
        this.displayCredentials(credentials);
        app.use(url, this.basicAuth({authorizer: this.handleAuthorization.bind(this)}));
    }
    handleAuthorization(username, password) {
        const credentials = new Credentials(this.db.getData(CREDENTIALS_LOCATION));
        return credentials.equals(this.basicAuth, username, password);
    }
    initializeCredentials() {
        try {
            return new Credentials(this.db.getData(CREDENTIALS_LOCATION));
        } catch (e) {
            const credentials = Credentials.generate(this.md5);
            this.db.push(DATA_LOCATION, {credentials});
            return credentials;
        }
    }
    displayCredentials(credentials) {
        const attentionGrabber = '#'.repeat(100);
        this.logger.log(attentionGrabber);
        this.logger.log('Use following secret as a basic auth credentials to upload files:');
        this.logger.log(credentials.toString());
        this.logger.log(attentionGrabber);
    }
}

module.exports = Authorization;