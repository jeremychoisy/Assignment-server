const uuid = require('uuid');

exports.formSetup = (form, data, type) => {
    form.on('fileBegin', function (name, file) {
        file.path = type ? './public/pictures/' + type + '/' + uuid.v4() + '.' + file.name.split('.').pop() : undefined;
    });
    form.on('field', function (name, value) {
        if (data[name]) {
            if (!Array.isArray(data[name])) {
                data[name] = [data[name]];
            }
            data[name].push(value);
        } else {
            data[name] = value;
        }
    });
    form.on('file', function (field, file) {
        const fileName = file.path.substring(file.path.lastIndexOf('/') + 1);
        data[field] = type ? 'http://' + ip + ':5000/' + type + '/' + fileName : undefined;
    });
};
