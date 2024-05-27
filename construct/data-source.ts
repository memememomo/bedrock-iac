import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { embeddingModelArn } from '../service/const';
import { Kms } from './kms';

export type KnowledgeBaseArgs = {
    name: string;
    roleArn: string;
};

export type OpenSearchServerlessArgs = {
    collectionArn: string;
};

export type BedrockDataSourceProps = {
    region: string,
    knowledgeBaseArgs: KnowledgeBaseArgs;
    bucketArn: string;
    openSearchServerlessArgs: OpenSearchServerlessArgs;
};

export class BedrockDataSource extends Construct {
    constructor(scope: Construct, id: string, props: BedrockDataSourceProps) {
        super(scope, id);

        // KnowledgeBase作成
        const cfnKnowledgeBase = new bedrock.CfnKnowledgeBase(this, 'KnowledgeBase', {
            name: props.knowledgeBaseArgs.name,
            roleArn: props.knowledgeBaseArgs.roleArn,
            knowledgeBaseConfiguration: {
                type: 'VECTOR',
                vectorKnowledgeBaseConfiguration: {
                    embeddingModelArn: embeddingModelArn(this, props.region),
                },
            },
            storageConfiguration: {
                type: 'OPENSEARCH_SERVERLESS',
                opensearchServerlessConfiguration: {
                    collectionArn: props.openSearchServerlessArgs.collectionArn,
                    fieldMapping: {
                        metadataField: 'metadata',
                        textField: 'text',
                        vectorField: 'vector',
                    },
                    vectorIndexName: 'bedrock-rag',
                }
            }
        });

        const key = new Kms(this, 'KmsKeyDataSource', {
            alias: `data-source/${props.knowledgeBaseArgs.name}`,
        }).key;

        const cfnDataSource = new bedrock.CfnDataSource(this, 'BedrockDataSource', {
            name: `${props.knowledgeBaseArgs.name}-data-source`,
            description: 'data source',
            dataSourceConfiguration: {
                s3Configuration: {
                    bucketArn: props.bucketArn,
                },
                type: 'S3',
            },
            knowledgeBaseId: cfnKnowledgeBase.attrKnowledgeBaseId,

            dataDeletionPolicy: 'DELETE',
            serverSideEncryptionConfiguration: {
                kmsKeyArn: key.keyArn,
            },
            vectorIngestionConfiguration: {
                chunkingConfiguration: {
                    chunkingStrategy: 'FIXED_SIZE',
                    fixedSizeChunkingConfiguration: {
                        maxTokens: 300,
                        overlapPercentage: 20,
                    }
                },
            },
        });
    }
}