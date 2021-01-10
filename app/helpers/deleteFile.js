const fs = require('fs');

exports.deleteFile = (path, type) => {
    if (path) {
        const file = path.substring(path.lastIndexOf('/') + 1);
        try {
            fs.unlinkSync('public/pictures/' + type + '/' + file);
        } catch (err) {
            console.log(err)
        }
    }
};
