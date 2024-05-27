export const PARAMS = {
    OASS: {
        COLLECTION_NAME: 'bedrock-collection',
        INDEX_NAME: 'bedrock-index',
    } as const,
    BEDROCK: {
        ROLE_NAME: 'bedrock-role',
        EMBEDDING_MODEL_NAME: 'amazon.titan-embed-text-v1',
        DATASOURCE_BUCKET_NAME: 'bedrock-datasource',
    } as const,
    CUSTOM_RESOURCE: {
        ROLE_NAME: 'custom-resource-role',
    } as const,
} as const;

export const EXPORT_NAME = {
    VPC_ID: 'VpcId',
    PRIVATE_SUBNETS: 'PrivateSubnets',
    PUBLIC_SUBNETS: 'PublicSubnets',
    DATASOURCE_BUCKET: 'DatasourceBucket',
    COLLECTION_ARN: 'CollectionArn',
    COLLECTION_ENDPOINT: 'CollectionEndpoint',
} as const;


