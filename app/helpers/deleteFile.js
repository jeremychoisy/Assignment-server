exports.deleteFile = (url) => {
    try {
        const splitUrl = url.split('/');
        const fileName = splitUrl[splitUrl.length - 1];
        const bucketName = process.env.AWS_BUCKET_NAME;
        const s3Params = {
            Bucket: bucketName,
            Key: fileName,
        };
        S3.deleteObject(s3Params, (err, _data) => {
            if(err){
                console.log('AWS: ' + err.toString());
            } else {
                console.log(fileName + ' deleted.')
            }
        });
    } catch (err) {
        console.err(err);
    }
}
