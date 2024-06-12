export const APP_NAME = "bedrock-rag";

export const agentName = () => `${APP_NAME}-agent`;

export const PARAMS = {
  OASS: {
    COLLECTION_NAME: "bedrock-collection",
    INDEX_NAME: "bedrock-index",
  } as const,
  BEDROCK: {
    ROLE_NAME: "bedrock-role",
    EMBEDDING_MODEL_NAME: "amazon.titan-embed-text-v1",
    DATASOURCE_BUCKET_NAME: "bedrock-datasource",
    FOUNDATION_MODEL_NAME: "anthropic.claude-3-sonnet-20240229-v1:0",
    KNOWLEDGE_BASE_NAME: "rag",
    GUARDRAIL_NAME: "rag",
    // FOUNDATION_MODEL_NAME: 'anthropic.claude-3-haiku-20240307-v1:0',
    DIMENSION: 1536,
    INDEX_NAME: "rag",
  } as const,
  CUSTOM_RESOURCE: {
    ROLE_NAME: "custom-resource-role",
  } as const,
  SECRET_KEY: {
    PINECONE_API_KEY: (prefix: string) => `${prefix}/pinecone-api-key`,
    PINECONE_INDEX_ENDPOINT: (prefix: string) => `${prefix}/pinecone-index-endpoint`,
  } as const,
} as const;

export const EXPORT_NAME = {
  VPC_ID: "VpcId",
  PRIVATE_SUBNETS: "PrivateSubnets",
  PUBLIC_SUBNETS: "PublicSubnets",
  COLLECTION_ARN: "CollectionArn",
  COLLECTION_ENDPOINT: "CollectionEndpoint",
  DATASOURCE_BUCKET: "DatasourceBucket",
  KNOWLEDGE_BASE_ID: "BedrockKnowledgebaseId",
  KNOWLEDGE_BASE_ROLE: "BedrockKnowledgebaseRole",
  KNOWLEDGE_BASE_ARN: "BedrockKnowledgebaseArn",
  DATA_SOURCE_ID: "BedrockDatasourceId",
  PINECONE_SECRET: "PineconeSecret",
  AGENT_ID: "BedrockAgentId",
} as const;

export const StorageStoreTypes = {
  Pinecone: "Pinecone",
  OpenSearchServerless: "OpenSearchServerless",
} as const;
export type StorageStoreType = (typeof StorageStoreTypes)[keyof typeof StorageStoreTypes];
