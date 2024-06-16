import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { BedrockAgentSchemaBucket } from "../construct/bedrock-agent-schema-bucket";
import { Config } from "../service/types";

export interface BedrockAgentSchemaStackProps extends cdk.StackProps {
  config: Config;
}

export class BedrockAgentSchemaStack extends cdk.Stack {
  public readonly schemaBucket: BedrockAgentSchemaBucket;

  constructor(scope: Construct, id: string, props: BedrockAgentSchemaStackProps) {
    super(scope, id);

    this.schemaBucket = new BedrockAgentSchemaBucket(this, "BedrockAgentSchemaBucket", {
      prefix: props.config.prefix,
      schemaFilePath: "./src/resources/schema",
    });
  }
}