import { Construct } from "constructs";
import * as bedrock from "aws-cdk-lib/aws-bedrock";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import { randomName } from "../service/util";
import { BedrockAgentSchemaBucket } from "./bedrock-agent-schema-bucket";

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
  schemaBucket: BedrockAgentSchemaBucket;
};

export class BedrockAgent extends Construct {
  public readonly agentId: string;

  constructor(scope: Construct, id: string, props: BedrockAgentProps) {
    super(scope, id);

    const { schemaBucket } = props;

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
              resources: [schemaBucket.getSchemaFileArn()],
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
              s3BucketName: schemaBucket.bucketName,
              s3ObjectKey: schemaBucket.s3ObjectKey,
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
