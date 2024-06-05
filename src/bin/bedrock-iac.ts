#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { BedrockStack } from "../lib/bedrock-stack";
import { AgentStack } from "../lib/agent-stack";
import { PineconeStack } from "../lib/pinecone-stack";
import { StorageStoreType } from "../service/const";
import { Config } from "../service/types";
import { PineconeSecretStack } from "../lib/pinecone-secret-stack";
import { OpenSearchStack } from "../lib/opensearch-stack";

const app = new cdk.App();

const dev: Config = {
  prefix: "bedrock-dev",
  storageStoreType: StorageStoreType.Pinecone,
};

const pineconeStacks = () => {
  const pineconeSecretKeyStack = new PineconeSecretStack(app, "PineconeSecretStack", {
    config: dev,
  });
  const pineconeStack = new PineconeStack(app, "PineconeStack", {
    config: dev,
  });
  pineconeStack.addDependency(pineconeSecretKeyStack);
  return pineconeStack;
};

const decideStorageStoreStack = () => {
  switch (dev.storageStoreType) {
    case "OpenSearchServerless":
      return new OpenSearchStack(app, "OpenSearchStack", {
        config: dev,
      });
    default:
      return pineconeStacks();
  }
};

const storageStack = decideStorageStoreStack();
const bedrockStack = new BedrockStack(app, "BedrockStack", {
  config: dev,
});
bedrockStack.addDependency(storageStack);

const agentStack = new AgentStack(app, "AgentStack");
agentStack.addDependency(bedrockStack);
