import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export type KmsProps = {
    alias: string;
};

export class Kms extends Construct {
    public readonly key: kms.Key;

    constructor(scope: Construct, id: string, props: KmsProps) {
        super(scope, id);

        this.key = new kms.Key(this, 'kms-key', {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            pendingWindow: cdk.Duration.days(7),
            alias: props.alias,
            enableKeyRotation: true,
        });
    }
}


