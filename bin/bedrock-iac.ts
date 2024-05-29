#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BedrockStack } from '../lib/bedrock-stack';
import { VpcStack } from '../lib/vpc-stack';
import { OpenSearchStack } from '../lib/opensearch-stack';
import {AgentStack} from "../lib/agent-stack";
import {PineconeStack} from "../lib/pinecone-stack";
import {StorageStoreType} from "../service/const";

const app = new cdk.App();
const vpcStack = new VpcStack(app, 'BedrockVpcStack');

const opensearchStack = new OpenSearchStack(app, 'OpenSearchStack');
//const pineconeStack = new PineconeStack(app, 'PineconeStack');

const bedrockStack = new BedrockStack(app, 'BedrockStack', {
    config: {
        storageStoreType: StorageStoreType.OpenSearchServerless,
        //storageStoreType: StorageStoreType.Pinecone,
    },
});
bedrockStack.addDependency(opensearchStack);
//bedrockStack.addDependency(pineconeStack);

const agentStack = new AgentStack(app, 'AgentStack');
agentStack.addDependency(bedrockStack);