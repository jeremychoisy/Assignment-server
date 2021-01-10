const mongoose = require('mongoose');
const formidable = require('formidable');
const formHelper = require('../helpers/formSetup');


const Subject = mongoose.model( 'Subject' );

exports.create = async (req, res) => {
    try {
        const form = new formidable.IncomingForm(), data = {};
        formHelper.formSetup(form, data, 'subject-pic');
        form.on('error', function (err) {
            res.status(400).json({
                message: err.toString()
            });
        });
        form.on('end', async () => {
            const subject = await Subject.findOne({name: data.name});
            if (subject) {
                res.status(409).json({
                    message: 'A subject with the same name already exists.'
                });
            } else {
                const subject = await Subject.create(data);

                res.status(200).json({
                    subject
                });
            }
        });
        form.parse(req);
    } catch ( err ){
        res.status(500).json({
            message: err.toString()
        });
    }
};
