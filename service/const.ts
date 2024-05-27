import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";


export const PARAMS = {
    OASS: {
        COLLECTION_NAME: 'bedrock-collection',
        INDEX_NAME: 'bedrock-index',
    } as const,
    BEDROCK: {
        ROLE_NAME: 'bedrock-role',
        EMBEDDING_MODEL_NAME: 'amazon.titan-embed-text-v1',
        DATASOURCE_BUCKET_NAME: 'bedrock-datasource',
    } as const,
    CUSTOM_RESOURCE: {
        ROLE_NAME: 'custom-resource-role',
    } as const,
} as const;

export const EXPORT_NAME = {
    VPC_ID: 'VpcId',
    PRIVATE_SUBNETS: 'PrivateSubnets',
    PUBLIC_SUBNETS: 'PublicSubnets',
    DATASOURCE_BUCKET: 'DatasourceBucket',
    COLLECTION_ARN: 'CollectionArn',
    COLLECTION_ENDPOINT: 'CollectionEndpoint',
} as const;

export const region = (c: Construct) => cdk.Stack.of(c).region;
export const account = (c: Construct) => cdk.Stack.of(c).account;

export const s3Arn = (c: Construct, bucketName: string) => 
    cdk.Arn.format({
        partition: 'aws',
        region: '',
        account: '',
        service: 's3',
        resource: bucketName,
    })

export const aossCollectionArn = (c: Construct, collectionName: string) => 
    cdk.Arn.format({
        partition: 'aws',
        service: 'aoss',
        region: region(c),
        account: account(c),
        resource: 'collection',
        resourceName: collectionName,
    });

export const embeddingModelArn = (c: Construct, modelName: string) => 
    cdk.Arn.format({
        partition: 'aws',
        service: 'bedrock',
        account: '',
        region: region(c),
        resource: 'foundation-model',
        resourceName: modelName,
    });

export const ssmArn = (c: Construct, parameterName: string) =>
    cdk.Arn.format({
        partition: 'aws',
        service: 'ssm',
        region: region(c),
        account: account(c),
        resource: 'parameter',
        resourceName: parameterName,
    });

export const roleArn = (c: Construct, roleName: string) =>
    cdk.Arn.format({
        partition: 'aws',
        service: 'iam',
        region: '',
        account: account(c),
        resource: 'role',
        resourceName: roleName,
    });

export const bedrockRoleArn = (c: Construct) =>
    roleArn(c, PARAMS.BEDROCK.ROLE_NAME);

export const customResourceRoleArn = (c: Construct) =>
    roleArn(c, PARAMS.CUSTOM_RESOURCE.ROLE_NAME);

export const s3PolicyStatements = (c: Construct, bucketName: string) =>
    [
        new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: [s3Arn(c, bucketName)],
            actions: ['s3:ListBucket'],
            conditions: {
                StringEquals: {
                    "aws:ResourceAccount": account(c),
                }
            },
        }),
        new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: [`${s3Arn(c, bucketName)}/*`],
            actions: ['s3:GetObject'],
            conditions: {
                StringEquals: {
                    "aws:ResourceAccount": account(c),
                }
            }
        }),
    ]

export const kmsPolicyStatements = (c: Construct, keyArn: string) =>
    [
        new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: [keyArn],
            actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:GenerateDataKey',
            ],
        })
    ]

// 6文字のランダムな文字列を生成
export const randomName = (c: Construct) =>
    cdk.Names.uniqueId(c).slice(-6).toLowerCase();


