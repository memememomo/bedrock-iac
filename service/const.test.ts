import * as cdk from "aws-cdk-lib";
import { EXPORT_NAME } from "../service/const";
import {account, aossCollectionArn, embeddingModelArn, region, s3Arn} from "./util";


test("EXPORT_NAME.VPC_ID is defined", () => {
  expect(EXPORT_NAME.VPC_ID).toBeDefined();
});

describe("arn functions", () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "MockStack", {
    env: {
      region: 'us-west-2',
      account: '1234567890',
    }
  });

  test("region function returns the correct value", () => {
    expect(region(stack)).toBe("us-west-2");
  });

  test("account function returns the correct value", () => {
    expect(account(stack)).toBe("1234567890");
  });

  test("s3Arn function returns the correct value", () => {
    const expectedArn = "arn:aws:s3:::bucketName";
    expect(s3Arn(stack, "bucketName")).toBe(expectedArn);
  });

  test("aossCollectionArn function returns the correct value", () => {
    const expectedArn = "arn:aws:aoss:us-west-2:1234567890:collection/collectionName";
    expect(aossCollectionArn(stack, "collectionName")).toBe(expectedArn);
  });

  test("embeddingModelArn function returns the correct value", () => {
    const expectedArn = "arn:aws:bedrock:us-west-2::foundation-model/modelName";
    expect(embeddingModelArn(stack, "modelName")).toBe(expectedArn);
  });
});

