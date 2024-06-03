import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as bedrock from "aws-cdk-lib/aws-bedrock";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import { randomName } from "../service/util";

type KnowledgeBaseParams = {
  knowledgeBaseId: string;
  description: string;
};

type BedrockAgentProps = {
  prefix: string;
  schemaFilePath: string;
  executorCodePath: string;
  foundationModel: string;
  instruction: string;
  knowledgeBaseParams: KnowledgeBaseParams;
};

export class BedrockAgent extends Construct {
  public readonly agentId: string;

  constructor(scope: Construct, id: string, props: BedrockAgentProps) {
    super(scope, id);

    // APIスキーマをS3にデプロイ
    const apiSchemaBucketName = `${props.prefix}-api-schema-${randomName(this)}`;
    const s3ObjectKey = "api-schema.json";
    const apiSchemaBucket = new s3.Bucket(this, "ApiSchemaBucket", {
      bucketName: apiSchemaBucketName,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    new s3deploy.BucketDeployment(this, "ApiSchemaDeployment", {
      sources: [s3deploy.Source.asset(props.schemaFilePath)],
      destinationBucket: apiSchemaBucket,
    });

    // ActionExecutor用LambdaのIAMロール
    const actionExecutorRole = new iam.Role(this, "ActionExecutorRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      inlinePolicies: {
        bedrockPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["bedrock:InvokeModel"],
              resources: ["*"],
            }),
          ],
        }),
      },
    });

    // ActionExecutor用Lambda
    const actionExecutorF = new lambda.Function(this, "ActionExecutor", {
      runtime: lambda.Runtime.PYTHON_3_10,
      code: lambda.Code.fromAsset(props.executorCodePath),
      handler: "lambda_function.handler",
      role: actionExecutorRole,
    });

    // Agent用のIAMロール
    const agentRole = new iam.Role(this, "AgentRole", {
      roleName: `AmazonBedrockExecutionRoleForAgents_${randomName(this)}`,
      assumedBy: new iam.ServicePrincipal("bedrock.amazonaws.com"),
      inlinePolicies: {
        bedrockPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["bedrock:InvokeModel"],
              resources: ["*"],
            }),
          ],
        }),
        apiSchemaBucket: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["s3:GetObject"],
              resources: [`${apiSchemaBucket.bucketArn}/${s3ObjectKey}`],
            }),
          ],
        }),
        actionLambda: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["lambda:InvokeFunction"],
              resources: [actionExecutorF.functionArn],
            }),
          ],
        }),
      },
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")],
    });

    // Agent作成
    const cfnAgent = new bedrock.CfnAgent(this, "BedrockAgent", {
      agentName: `${props.prefix}-agent`,
      actionGroups: [
        {
          actionGroupState: "ENABLED",
          actionGroupName: "api-schema",
          actionGroupExecutor: {
            lambda: actionExecutorF.functionArn,
          },
          apiSchema: {
            s3: {
              s3BucketName: apiSchemaBucket.bucketName,
              s3ObjectKey,
            },
          },
        },
      ],
      knowledgeBases: [
        {
          knowledgeBaseId: props.knowledgeBaseParams.knowledgeBaseId,
          description: props.knowledgeBaseParams.description,
          knowledgeBaseState: "ENABLED",
        },
      ],
      foundationModel: props.foundationModel,
      agentResourceRoleArn: agentRole.roleArn,
      autoPrepare: true,
      instruction: props.instruction,
    });

    this.agentId = cfnAgent.attrAgentId;
  }
}
