import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct }  from 'constructs';
import { Kms } from './kms';

export type S3Props = {
    name: string;
};

export class SecureS3 extends Construct {
    public readonly key: kms.Key;
    public readonly bucket: s3.Bucket;

    constructor(scope: Construct, id: string, props: S3Props) {
        super(scope, id);

        this.key = new Kms(this, 'KmsKeyS3', {
            alias: `s3/${props.name}`,
        }).key;
        
        this.bucket = new s3.Bucket(this, 'SecureS3Bucket', {
            bucketName: props.name,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            encryption: s3.BucketEncryption.KMS,
            encryptionKey: this.key,
        });
    }
}