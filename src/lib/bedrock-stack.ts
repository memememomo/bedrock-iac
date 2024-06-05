import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { EXPORT_NAME, PARAMS, StorageStoreType } from "../service/const";
import { SecureS3 } from "../construct/secure-s3";
import { BedrockGuardrail } from "../construct/guardrail";
import { KnowledgeBase, OpenSearchServerlessParams, PineconeParams } from "../construct/knowledgebase";
import { resourceNameWithPrefix } from "../service/util";
import { Config } from "../service/types";

interface BedrockStackProps extends cdk.StackProps {
  config: Config;
  pinecone?: {
    apiKeySecret: Secret;
  };
}

const storageStore = (props: BedrockStackProps) => {
  const collectionArn = cdk.Fn.importValue(EXPORT_NAME.COLLECTION_ARN);
  const collectionEndpoint = cdk.Fn.importValue(EXPORT_NAME.COLLECTION_ENDPOINT);

  const { prefix, storageStoreType } = props.config;

  switch (storageStoreType) {
    case StorageStoreType.Pinecone:
      return {
        pineconeParams: {
          apiKeySecret: props.pinecone?.apiKeySecret,
          indexEndpointSecretKey: PARAMS.SECRET_KEY.PINECONE_INDEX_ENDPOINT(prefix),
          indexEndpointSecretKeyFullArn: props.pinecone?.apiKeySecret?.secretArn ?? "",
        } as PineconeParams,
      };
    default:
      return {
        openSearchServerlessParams: {
          collectionName: PARAMS.OASS.COLLECTION_NAME,
          collectionArn,
          collectionEndpoint,
          indexName: PARAMS.OASS.INDEX_NAME,
        } as OpenSearchServerlessParams,
      };
  }
};

export class BedrockStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BedrockStackProps) {
    super(scope, id, props);

    const { prefix } = props.config;

    const dataSourceBucket = new SecureS3(this, "KnowledgeBaseS3Bucket", {
      name: resourceNameWithPrefix(prefix, PARAMS.BEDROCK.DATASOURCE_BUCKET_NAME),
    });

    // Guardrail作成
    new BedrockGuardrail(this, "Guardrail", {
      name: resourceNameWithPrefix(prefix, PARAMS.BEDROCK.GUARDRAIL_NAME),
    });

    // KnowledgeBase作成
    const knowledgebase = new KnowledgeBase(this, "KnowledgeBase", {
      embeddingModelName: PARAMS.BEDROCK.EMBEDDING_MODEL_NAME,
      knowledgeBaseParams: {
        name: resourceNameWithPrefix(prefix, PARAMS.BEDROCK.KNOWLEDGE_BASE_NAME),
        bucket: dataSourceBucket.bucket,
      },
      ...storageStore(props),
    });

    // 出力
    new cdk.CfnOutput(this, "KnowledgeBaseId", {
      value: knowledgebase.knowledgeBaseId,
      exportName: EXPORT_NAME.KNOWLEDGE_BASE_ID,
    });
    new cdk.CfnOutput(this, "KnowledgeBaseArn", {
      value: knowledgebase.knowledgeBaseArn,
      exportName: EXPORT_NAME.KNOWLEDGE_BASE_ARN,
    });
    new cdk.CfnOutput(this, "KnowledgeBaseRole", {
      value: knowledgebase.knowledgeBaseRole.roleArn,
      exportName: EXPORT_NAME.KNOWLEDGE_BASE_ROLE,
    });
    new cdk.CfnOutput(this, "DataSourceId", {
      value: knowledgebase.dataSourceId,
      exportName: EXPORT_NAME.DATA_SOURCE_ID,
    });
    new cdk.CfnOutput(this, "DataSourceBucket", {
      value: dataSourceBucket.bucket.bucketName,
      exportName: EXPORT_NAME.DATASOURCE_BUCKET,
    });
  }
}
