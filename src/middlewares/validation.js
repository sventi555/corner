function validate(schemas) {
    return (req, res, next) => {

        if (schemas.query) {
            const {error} = schemas.query.validate(req.query);
            return next(error);
        }
        if (schemas.body) {
            const {error} = schemas.body.validate(req.body);
            return next(error);
        }
        if (schemas.params) {
            const {error} = schemas.params.validate(req.params);
            return next(error);
        }

        return next();
    };
}

module.exports = {validate, joi: require('@hapi/joi')};
