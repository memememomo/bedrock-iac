import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Pinecone } from "../construct/pinecone";
import { PARAMS } from "../service/const";
import { Config } from "../service/types";
import { resourceNameWithPrefix } from "../service/util";

export interface PineconeStackProps extends cdk.StackProps {
  config: Config;
}

export class PineconeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PineconeStackProps) {
    super(scope, id, props);

    new Pinecone(this, "Pinecone", {
      apiKeySecretKey: PARAMS.SECRET_KEY.PINECONE_API_KEY(props.config.prefix),
      indexEndpointSecretKey: PARAMS.SECRET_KEY.PINECONE_INDEX_ENDPOINT(props.config.prefix),
      dimension: PARAMS.BEDROCK.DIMENSION,
      indexName: resourceNameWithPrefix(props.config.prefix, PARAMS.OASS.INDEX_NAME),
    });
  }
}
