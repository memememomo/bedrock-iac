import { CfnOutput, RemovalPolicy, SecretValue, Stack, StackProps } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { Config } from "../service/types";
import { EXPORT_NAME, PARAMS } from "../service/const";

export interface PineconeSecretStackProps extends StackProps {
  config: Config;
}

export class PineconeSecretStack extends Stack {
  apiKeySecret: Secret;

  constructor(scope: Construct, id: string, props: PineconeSecretStackProps) {
    super(scope, id, props);

    const { prefix } = props.config;

    this.apiKeySecret = new Secret(this, "PineconeApiKeySecret", {
      secretName: PARAMS.SECRET_KEY.PINECONE_API_KEY(prefix),
      removalPolicy: RemovalPolicy.DESTROY,
      secretObjectValue: {
        apiKey: new SecretValue("Pinecone API Key"),
      },
    });

    new CfnOutput(this, "PineconeApiKeySecretArn", {
      exportName: EXPORT_NAME.PINECONE_SECRET,
      value: this.apiKeySecret.secretArn,
    });
  }
}
