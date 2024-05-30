import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {EXPORT_NAME, PARAMS, StorageStoreType} from '../service/const';
import { SecureS3 } from '../construct/secure-s3';
import { BedrockGuardrail } from '../construct/guardrail';
import { KnowledgeBase } from '../construct/knowledgebase';


interface Config {
    storageStoreType: StorageStoreType,
}

interface BedrockStackProps extends cdk.StackProps {
    config: Config;
}

export class BedrockStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BedrockStackProps) {
      super(scope, id, props);


      const s3BucketName = 'bedrock-rag-esa';
      const guardrailName = 'bedrock-rag';
      const knowledgeBaseName = 'bedrock-rag';

      // S3作成
      const s3Bucket = new SecureS3(this, 'KnowledgeBaseS3Bucket', {
        name: s3BucketName,
      });

      // Guardrail作成
      const guardrail = new BedrockGuardrail(this, 'Guardrail', {
        name: guardrailName,
      });

      // KnowledgeBase作成
      const knowledgebase = new KnowledgeBase(this, 'KnowledgeBase', {
          embeddingModelName: PARAMS.BEDROCK.EMBEDDING_MODEL_NAME,
          knowledgeBaseParams: {
            name: knowledgeBaseName,
            bucket: s3Bucket.bucket,
          },
          ...this.storageStore(props),
      });

      // 出力
      new cdk.CfnOutput(this, 'KnowledgeBaseId', {
          value: knowledgebase.knowledgeBaseId,
          exportName: EXPORT_NAME.KNOWLEDGE_BASE_ID,
      });
        new cdk.CfnOutput(this, 'KnowledgeBaseArn', {
            value: knowledgebase.knowledgeBaseArn,
            exportName: EXPORT_NAME.KNOWLEDGE_BASE_ARN,
        });
        new cdk.CfnOutput(this, 'KnowledgeBaseRole', {
            value: knowledgebase.knowledgeBaseRole.roleArn,
            exportName: EXPORT_NAME.KNOWLEDGE_BASE_ROLE,
        });
        new cdk.CfnOutput(this, 'DataSourceId', {
            value: knowledgebase.dataSourceId,
            exportName: EXPORT_NAME.DATA_SOURCE_ID,
        });
      new cdk.CfnOutput(this, 'DataSourceBucket', {
        value: s3Bucket.bucket.bucketName,
        exportName: EXPORT_NAME.DATASOURCE_BUCKET,
      });
  }

  storageStore(props: BedrockStackProps) {
      switch (props.config.storageStoreType) {
        case StorageStoreType.Pinecone:
            return {
                pineconeParams: {
                    apiKeySecretKey: PARAMS.SECRET_KEY.PINECONE_API_KEY,
                    indexEndpointSecretKey: PARAMS.SECRET_KEY.PINECONE_INDEX_ENDPOINT,
                }
            };
        default:
            const collectionArn = cdk.Fn.importValue(EXPORT_NAME.COLLECTION_ARN);
            const collectionEndpoint = cdk.Fn.importValue(EXPORT_NAME.COLLECTION_ENDPOINT);
            return {
                openSearchServerlessParams: {
                    collectionName: PARAMS.OASS.COLLECTION_NAME,
                    collectionArn: collectionArn,
                    collectionEndpoint: collectionEndpoint,
                    indexName: PARAMS.OASS.INDEX_NAME,
                },
            }
      }
  }

}
