import * as bedrock from "aws-cdk-lib/aws-bedrock";
import * as iam from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { CustomResource, Duration, SecretValue } from "aws-cdk-lib";
import { Provider } from "aws-cdk-lib/custom-resources";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { CfnKnowledgeBase } from "aws-cdk-lib/aws-bedrock/lib/bedrock.generated";
import { Kms } from "./kms";
import { embeddingModelArn, kmsPolicyStatements, s3PolicyStatements, secretsManagerPartialArn } from "../service/util";
import { PARAMS } from "../service/const";
import StorageConfigurationProperty = CfnKnowledgeBase.StorageConfigurationProperty;

type KnowledgeBaseParams = {
  name: string;
  bucket: Bucket;
};

export type OpenSearchServerlessParams = {
  collectionArn: string;
  collectionEndpoint: string;
  collectionName: string;
  indexName: string;
};

export type PineconeParams = {
  apiKeySecretKey: string;
  indexEndpointSecretKey: string;
  indexEndpointSecretKeyFullArn: string;
};

type KnowledgeBaseProps = {
  embeddingModelName: string;
  knowledgeBaseParams: KnowledgeBaseParams;
  openSearchServerlessParams?: OpenSearchServerlessParams;
  pineconeParams?: PineconeParams;
};

const storageConfiguration = (props: KnowledgeBaseProps): StorageConfigurationProperty => {
  if (props.openSearchServerlessParams != null) {
    return {
      type: "OPENSEARCH_SERVERLESS",
      opensearchServerlessConfiguration: {
        collectionArn: props.openSearchServerlessParams.collectionArn,
        fieldMapping: {
          metadataField: "metadata",
          textField: "text",
          vectorField: `${props.openSearchServerlessParams.indexName}-vector`,
        },
        vectorIndexName: props.openSearchServerlessParams.indexName,
      },
    };
  }

  if (props.pineconeParams != null) {
    const endpoint = SecretValue.secretsManager(props.pineconeParams.indexEndpointSecretKey).unsafeUnwrap();

    return {
      type: "PINECONE",
      pineconeConfiguration: {
        connectionString: `https://${endpoint}/`,
        credentialsSecretArn: props.pineconeParams.indexEndpointSecretKeyFullArn,
        fieldMapping: {
          metadataField: "metadata",
          textField: "text",
        },
      },
    };
  }

  // どちらでもない場合はUNKNOWNでひとまずエラーを出す
  return {
    type: "UNKNOWN",
  };
};

export class KnowledgeBase extends Construct {
  knowledgeBaseId: string;

  knowledgeBaseArn: string;

  knowledgeBaseRole: iam.Role;

  dataSourceId: string;

  constructor(scope: Construct, id: string, props: KnowledgeBaseProps) {
    super(scope, id);

    const { key } = new Kms(this, "KmsKeyDataSource", {
      alias: `data-source/${props.knowledgeBaseParams.name}`,
    });

    const knowledgebasePolicies: { [name: string]: iam.PolicyDocument } = {
      embedding: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: [embeddingModelArn(this, props.embeddingModelName)],
            actions: ["bedrock:InvokeModel"],
          }),
        ],
      }),
      kms: new iam.PolicyDocument({
        statements: [kmsPolicyStatements(this, key.keyArn)],
      }),
      s3: new iam.PolicyDocument({
        statements: [...s3PolicyStatements(this, props.knowledgeBaseParams.bucket.bucketName)],
      }),
    };
    if (props.openSearchServerlessParams) {
      knowledgebasePolicies.aoss = new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: [props.openSearchServerlessParams.collectionArn],
            actions: ["aoss:*"],
          }),
        ],
      });
    } else if (props.pineconeParams) {
      knowledgebasePolicies.pinecone = new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: [secretsManagerPartialArn(this, props.pineconeParams.apiKeySecretKey)],
            actions: ["secretsmanager:GetSecretValue"],
          }),
        ],
      });
    }

    // KnowledgeBase用のIAMロール
    const knowledgebaseRole = new iam.Role(this, "KnowledgeBaseRole", {
      roleName: PARAMS.BEDROCK.ROLE_NAME,
      assumedBy: new iam.ServicePrincipal("bedrock.amazonaws.com"),
      inlinePolicies: knowledgebasePolicies,
    });
    this.knowledgeBaseRole = knowledgebaseRole;

    // KnowledgeBase用のS3バケットに対する読み書き権限を付与
    props.knowledgeBaseParams.bucket.grantReadWrite(this.knowledgeBaseRole);

    // KnowledgeBase作成
    const cfnKnowledgeBase = new bedrock.CfnKnowledgeBase(this, "BedrockKnowledgeBase", {
      name: props.knowledgeBaseParams.name,
      roleArn: this.knowledgeBaseRole.roleArn,
      knowledgeBaseConfiguration: {
        type: "VECTOR",
        vectorKnowledgeBaseConfiguration: {
          embeddingModelArn: embeddingModelArn(this, props.embeddingModelName),
        },
      },
      storageConfiguration: storageConfiguration(props),
    });

    // インデックスをカスタムリソースで作成
    if (props.openSearchServerlessParams != null) {
      const customResource = this.createOpenSearchIndexByCustomResource(props.openSearchServerlessParams);
      cfnKnowledgeBase.node.addDependency(customResource);
    }

    const cfnDataSource = new bedrock.CfnDataSource(this, "BedrockDataSource", {
      name: props.knowledgeBaseParams.name,
      dataSourceConfiguration: {
        s3Configuration: {
          bucketArn: props.knowledgeBaseParams.bucket.bucketArn,
        },
        type: "S3",
      },
      knowledgeBaseId: cfnKnowledgeBase.attrKnowledgeBaseId,

      dataDeletionPolicy: "DELETE",
      serverSideEncryptionConfiguration: {
        kmsKeyArn: key.keyArn,
      },
      vectorIngestionConfiguration: {
        chunkingConfiguration: {
          chunkingStrategy: "FIXED_SIZE",
          fixedSizeChunkingConfiguration: {
            maxTokens: 300,
            overlapPercentage: 20,
          },
        },
      },
    });

    this.knowledgeBaseId = cfnKnowledgeBase.attrKnowledgeBaseId;
    this.knowledgeBaseArn = cfnKnowledgeBase.attrKnowledgeBaseArn;
    this.dataSourceId = cfnDataSource.attrDataSourceId;
  }

  createOpenSearchIndexByCustomResource(props: OpenSearchServerlessParams) {
    // KnowledgeBase用のカスタムリソース用のIAMロール
    const customResourceRole = new iam.Role(this, "KnowledgeBaseCustomResourceRole", {
      roleName: PARAMS.CUSTOM_RESOURCE.ROLE_NAME,
      // Lambda関数がこのロールを引き継ぐ
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      // ポリシーをインラインで定義
      inlinePolicies: {
        // BedrockのAPIを呼び出すためのポリシー
        bedrockPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: ["*"],
              actions: ["bedrock:*KnowledgeBase", "bedrock:*DataSource", "iam:PassRole"],
            }),
          ],
        }),
        // OpenSearch Serverlessのコレクションのポリシー
        aossPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: ["*"],
              actions: ["aoss:*", "iam:CreateServiceLinkedRole"],
            }),
          ],
        }),
      },
      // AWS管理ポリシーを追加
      managedPolicies: [
        // Lambdaの基本的な実行権限
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
      ],
    });

    // カスタムリソース用のLambda関数
    const customResourceFunction = new NodejsFunction(this, "CustomResourceLambda", {
      entry: "./resources/knowledgebase/index.ts",
      handler: "handler",
      runtime: Runtime.NODEJS_LATEST,
      architecture: Architecture.ARM_64,
      timeout: Duration.minutes(15),
      role: customResourceRole,
    });

    // カスタムリソースのプロバイダー
    const provider = new Provider(this, "Provider", {
      onEventHandler: customResourceFunction,
      logRetention: RetentionDays.ONE_WEEK,
    });

    // カスタムリソースの作成
    const customResource = new CustomResource(this, "CustomResource", {
      serviceToken: provider.serviceToken,
      properties: {
        collectionEndpoint: props.collectionEndpoint,
        indexName: props.indexName,
      },
    });

    return customResource;
  }
}
