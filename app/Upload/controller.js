const uuid = require('uuid');

/**
 * Returns a signed request, used to upload a file straight to AWS S3.
 */
exports.getSignedRequest = async (req, res) => {
    try {
        const fileName = req.query.fileName + '-' + uuid.v4();
        const fileType = req.query.fileType;
        const bucketName = process.env.AWS_BUCKET_NAME;
        const s3Params = {
            Bucket: bucketName,
            Key: fileName,
            Expires: 60,
            ContentType: fileType,
            ACL: 'public-read'
        };
        S3.getSignedUrl('putObject', s3Params, (err, data) => {
            if(err){
                res.status(500).json({
                    message: 'AWS: ' + err.toString()
                });
            } else {
                const returnedData = {
                    signedRequest: data,
                    url: `https://${bucketName}.s3.amazonaws.com/${fileName}`
                };
                res.status(200).json(
                    returnedData
                );
            }
        });
    } catch (err) {
        res.status(500).json({
            message: err.toString()
        });
    }
}
