import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { CfnOutput } from "aws-cdk-lib";
import { EXPORT_NAME } from "../service/const";

export class VpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "vpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      vpcName: "bedrock",
    });

    new CfnOutput(this, "vpc-id", {
      value: vpc.vpcId,
      exportName: EXPORT_NAME.VPC_ID,
    });
  }
}
