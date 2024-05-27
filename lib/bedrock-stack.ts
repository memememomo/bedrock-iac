import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EXPORT_NAME, PARAMS } from '../service/const';
import { SecureS3 } from '../construct/secure-s3';
import { BedrockGuardrail } from '../construct/guardrail';
import { KnowledgeBase } from '../construct/knowledgebase';


export class BedrockStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

      const collectionArn = cdk.Fn.importValue(EXPORT_NAME.COLLECTION_ARN);
      const collectionEndpoint = cdk.Fn.importValue(EXPORT_NAME.COLLECTION_ENDPOINT);

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
        openSearchServerlessParams: {
          collectionName: PARAMS.OASS.COLLECTION_NAME,
          collectionArn: collectionArn,
          collectionEndpoint: collectionEndpoint,
          indexName: PARAMS.OASS.INDEX_NAME,
        }
      });

      // 出力
      new cdk.CfnOutput(this, 'DataSourceBucket', {
        value: s3Bucket.bucket.bucketName,
        exportName: EXPORT_NAME.DATASOURCE_BUCKET,
      });
  }
}
