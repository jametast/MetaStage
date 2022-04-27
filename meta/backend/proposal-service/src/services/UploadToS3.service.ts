import Aws from "aws-sdk";
const s3 = new Aws.S3({
    accessKeyId: process.env.ACCESSKEYID,
    secretAccessKey: process.env.SECRETACCESSKEY
})

 const uploadToS3 = async (file: any) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.originalName,
        Body: file.buffer,
        ACL: "public-read-write",
        ContentType: "image/jpeg",
    }
    
    try {
        // @ts-ignore
        const uploaded = await s3.upload(params).promise();
        return uploaded;
    } catch (error) {
        return error
    }
}

export default uploadToS3;