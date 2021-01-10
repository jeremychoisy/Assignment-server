const assignmentRouter = require('./Assignment/router');
const userRouter = require('./User/router');
const subjectRouter = require('./Subject/router');

module.exports = (app) => {
    app.use('/api/assignment', assignmentRouter);
    app.use('/api/user', userRouter);
    app.use('/api/subject', subjectRouter);
};
