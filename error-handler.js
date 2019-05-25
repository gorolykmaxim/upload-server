function ErrorHandler() {

}

ErrorHandler.prototype.handleError = function(err, req, res, next) {
    res.render('error/error', {err: err});
};

ErrorHandler.prototype.serveOn = function (app) {
    app.use(this.handleError.bind(this));
};

module.exports = ErrorHandler;
