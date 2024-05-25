#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BedrockStack } from '../lib/bedrock-stack';
import { VpcStack } from '../lib/vpc-stack';
import { OpenSearchStack } from '../lib/opensearch-stack';

const app = new cdk.App();
const vpcStack = new VpcStack(app, 'BedrockVpcStack');
const opensearchStack = new OpenSearchStack(app, 'OpenSearchStack');
const bedrockStack = new BedrockStack(app, 'BedrockStack');
bedrockStack.addDependency(opensearchStack);