const md5 = require('md5');
const basicAuth = require('express-basic-auth');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sinonChaiInOrder = require('sinon-chai-in-order').default;

const Authorization = require('../authorization');

chai.use(sinonChai);
chai.use(sinonChaiInOrder);
const expect = chai.expect;

describe('Authorization', () => {
    let db;
    let logger;
    let data;
    let authorization;
    beforeEach(() => {
        data = {
            credentials: {
                login: md5(Date.now() - 1000),
                password: md5(Date.now() + 1000)
            }
        };
        db = sinon.stub({getData: (path) => {}, push: (path, data) => {}});
        logger = sinon.stub({log: (message) => {}});
        db.getData.returns(data.credentials);
        authorization = new Authorization(basicAuth, db, logger, md5);
    });
    it('should initialize new credentials for the first time', () => {
        db.getData.throws(new Error());
        const credentials = authorization.initializeCredentials();
        expect(credentials.login).to.not.be.null;
        expect(credentials.password).to.not.be.null;
        expect(db.push).to.have.been.calledOnceWith('/authorization', {credentials});
    });
    it('should initialize new credentials due to corrupted existing ones', () => {
        db.getData.returns({login: data.credentials.login});
        const credentials = authorization.initializeCredentials();
        expect(credentials.login).to.not.be.null;
        expect(credentials.login).to.not.equal(data.credentials.login);
        expect(credentials.password).to.not.be.null;
        expect(db.push).to.have.been.calledOnceWith('/authorization', {credentials});
    });
    it('should display new credentials in logs', () => {
        const expectedSeparator = '#'.repeat(100);
        const credentials = authorization.initializeCredentials();
        authorization.displayCredentials(credentials);
        expect(logger.log).inOrder.to.have.been.calledWith(expectedSeparator)
            .subsequently.calledWith('Use following secret as a basic auth credentials to upload files:')
            .subsequently.calledWith(`${data.credentials.login}:${data.credentials.password}`)
            .subsequently.calledWith(expectedSeparator);
    });
    it('should allow incoming request with matching authorization', () => {
        const {login, password} = data.credentials;
        expect(authorization.handleAuthorization(login, password)).to.equal(1);
    });
    it('should forbid incoming request without matching authorization', () => {
        expect(authorization.handleAuthorization('fs0adbf', 'bafsdf89')).to.equal(0);
    });
});