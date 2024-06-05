import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as iam from "aws-cdk-lib/aws-iam";
import { Provider } from "aws-cdk-lib/custom-resources";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { CustomResource, Duration } from "aws-cdk-lib";
import { region, secretsManagerPartialArn } from "../service/util";

type PineconeProps = {
  apiKeySecretKey: string;
  indexEndpointSecretKey: string;
  dimension: number;
  indexName: string;
};

export class Pinecone extends Construct {
  constructor(scope: Construct, id: string, props: PineconeProps) {
    super(scope, id);

    const customResourceRole = new iam.Role(this, "PineconeCustomResourceRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      inlinePolicies: {
        ssmPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: [secretsManagerPartialArn(this, props.apiKeySecretKey)],
              actions: ["secretsmanager:GetSecretValue"],
            }),
            new iam.PolicyStatement({
              resources: [secretsManagerPartialArn(this, props.indexEndpointSecretKey)],
              actions: ["secretsmanager:CreateSecret", "secretsmanager:DeleteSecret"],
            }),
          ],
        }),
      },
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
    });

    const customResourceF = new lambda.DockerImageFunction(this, "CustomResourceFunction", {
      code: lambda.DockerImageCode.fromImageAsset("./resources/pinecone", {
        platform: ecr_assets.Platform.LINUX_ARM64,
      }),
      architecture: lambda.Architecture.ARM_64,
      timeout: Duration.minutes(15),
      role: customResourceRole,
    });

    const provider = new Provider(this, "PineconeProvider", {
      onEventHandler: customResourceF,
      logRetention: RetentionDays.ONE_WEEK,
    });

    new CustomResource(this, "PineconeCustomResource", {
      serviceToken: provider.serviceToken,
      properties: {
        region: region(this),
        indexName: props.indexName,
        dimension: props.dimension,
        apiKeySecretName: props.apiKeySecretKey,
        indexEndpointSecretName: props.indexEndpointSecretKey,
      },
    });
  }
}
