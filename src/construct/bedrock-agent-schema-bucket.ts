import { Construct } from "constructs";
import { randomName } from "../service/util";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

interface BedrockAgentSchemaProps {
  prefix: string;
  schemaFilePath: string;
}

export class BedrockAgentSchemaBucket extends Construct {
  private readonly schemaBucket: s3.Bucket;
  public readonly bucketName: string;
  public readonly s3ObjectKey: string;

  constructor(scope: Construct, id: string, props: BedrockAgentSchemaProps) {
    super(scope, id);

    // APIスキーマをS3にデプロイ
    this.bucketName = `${props.prefix}-api-schema-${randomName(this)}`;
    this.s3ObjectKey = "api-schema.json";
    const apiSchemaBucket = new s3.Bucket(this, "ApiSchemaBucket", {
      bucketName: this.bucketName,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.schemaBucket = apiSchemaBucket;
    new s3deploy.BucketDeployment(this, "ApiSchemaDeployment", {
      sources: [s3deploy.Source.asset(props.schemaFilePath)],
      destinationBucket: apiSchemaBucket,
    });
  }

  public getSchemaFileArn(): string {
    return `${this.schemaBucket.bucketArn}/${this.s3ObjectKey}`;
  }
}