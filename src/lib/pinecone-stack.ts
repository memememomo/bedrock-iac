import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Pinecone } from "../construct/pinecone";
import { PARAMS } from "../service/const";

export class PineconeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new Pinecone(this, "Pinecone", {
      apiKeySecretKey: PARAMS.SECRET_KEY.PINECONE_API_KEY,
      indexEndpointSecretKey: PARAMS.SECRET_KEY.PINECONE_INDEX_ENDPOINT,
      dimension: PARAMS.BEDROCK.DIMENSION,
      indexName: PARAMS.OASS.INDEX_NAME,
    });
  }
}
