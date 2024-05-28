export const APP_NAME = 'bedrock-rag';

export const agentName = () => `${APP_NAME}-agent`;

export const PARAMS = {
    OASS: {
        COLLECTION_NAME: 'bedrock-collection',
        INDEX_NAME: 'bedrock-index',
    } as const,
    BEDROCK: {
        ROLE_NAME: 'bedrock-role',
        EMBEDDING_MODEL_NAME: 'amazon.titan-embed-text-v1',
        DATASOURCE_BUCKET_NAME: 'bedrock-datasource',
        FOUNDATION_MODEL_NAME: 'anthropic.claude-3-sonnet-20240229-v1:0',
        //FOUNDATION_MODEL_NAME: 'anthropic.claude-3-haiku-20240307-v1:0',
    } as const,
    CUSTOM_RESOURCE: {
        ROLE_NAME: 'custom-resource-role',
    } as const,
} as const;

export const EXPORT_NAME = {
    VPC_ID: 'VpcId',
    PRIVATE_SUBNETS: 'PrivateSubnets',
    PUBLIC_SUBNETS: 'PublicSubnets',
    COLLECTION_ARN: 'CollectionArn',
    COLLECTION_ENDPOINT: 'CollectionEndpoint',
    DATASOURCE_BUCKET: 'DatasourceBucket',
    KNOWLEDGE_BASE_ID: 'bedrock-knowledgebase-id',
    KNOWLEDGE_BASE_ROLE: 'bedrock-knowledgebase-role',
    KNOWLEDGE_BASE_ARN: 'bedrock-knowledgebase-arn',
    DATA_SOURCE_ID: 'bedrock-datasource-id',
    AGENT_ID: 'bedrock-agent-id',
} as const;

