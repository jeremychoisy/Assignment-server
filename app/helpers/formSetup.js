exports.formSetup = (form, data) => {
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
};
