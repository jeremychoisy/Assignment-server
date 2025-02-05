const assignmentRouter = require('./Assignment/router');
const userRouter = require('./User/router');
const subjectRouter = require('./Subject/router');
const uploadRouter = require('./Upload/router')

module.exports = (app) => {
    app.use('/api/assignment', assignmentRouter);
    app.use('/api/user', userRouter);
    app.use('/api/subject', subjectRouter);
    app.use('/api/upload', uploadRouter);
};
