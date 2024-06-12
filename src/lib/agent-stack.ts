import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { APP_NAME, EXPORT_NAME, PARAMS } from "../service/const";
import { BedrockAgent } from "../construct/bedrock-agent";

export class AgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const knowledgeBaseId = cdk.Fn.importValue(EXPORT_NAME.KNOWLEDGE_BASE_ID);

    const agent = new BedrockAgent(this, "BedrockAgent", {
      prefix: APP_NAME,
      schemaFilePath: "./src/resources/schema",
      executorCodePath: "./src/resources/executor",
      foundationModel: PARAMS.BEDROCK.FOUNDATION_MODEL_NAME,
      instruction:
        "You are an agent that can handle various tasks related to insurance claims, including looking up claim \\ndetails, finding what paperwork is outstanding, and sending reminders. Only send reminders if you have been \\nexplicitly requested to do so. If an user asks about your functionality, provide guidance in natural language and do not include function names on the output",
      knowledgeBaseParams: {
        knowledgeBaseId,
        description: "agent knowledge base",
      },
    });

    new cdk.CfnOutput(this, "AgentId", {
      value: agent.agentId,
      exportName: EXPORT_NAME.AGENT_ID,
    });
  }
}
