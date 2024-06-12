#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { BedrockStack } from "../lib/bedrock-stack";
import { AgentStack } from "../lib/agent-stack";
import { PineconeStack } from "../lib/pinecone-stack";
import { StorageStoreTypes, StorageStoreType } from "../service/const";
import { Config } from "../service/types";
import { PineconeSecretStack } from "../lib/pinecone-secret-stack";
import { OpenSearchStack } from "../lib/opensearch-stack";

const app = new cdk.App();

const dev: Config = {
  prefix: "bedrock-dev",
  storageStoreType: StorageStoreTypes.Pinecone,
};

const buildBedrockStack = (storageStoreType: StorageStoreType) => {
  if (storageStoreType === StorageStoreTypes.Pinecone) {
    const pineconeSecretKeyStack = new PineconeSecretStack(app, "PineconeSecretStack", {
      config: dev,
    });
    const pineconeStack = new PineconeStack(app, "PineconeStack", {
      config: dev,
    });
    pineconeStack.addDependency(pineconeSecretKeyStack);

    const bedrockStack = new BedrockStack(app, "BedrockStack", {
      config: dev,
      pinecone: {
        apiKeySecret: pineconeSecretKeyStack.apiKeySecret,
      }
    });
    bedrockStack.addDependency(pineconeStack);
    return bedrockStack;
  }
  if (storageStoreType === StorageStoreTypes.OpenSearchServerless) {
    return new OpenSearchStack(app, "OpenSearchStack", {
      config: dev,
    });
  }
  throw new Error("Invalid storage store type");
};

const bedrockStack = buildBedrockStack(dev.storageStoreType);

const agentStack = new AgentStack(app, "AgentStack");
agentStack.addDependency(bedrockStack);
