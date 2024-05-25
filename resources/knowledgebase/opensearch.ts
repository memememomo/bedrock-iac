import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';


const AWS_REGION = process.env.AWS_REGION;

type CreateIndexParams = {
    collectionEndpoint: string;
    indexName: string;
};

export const createIndex = async (params: CreateIndexParams) => {
    const { collectionEndpoint, indexName } = params;
    console.log('Creating index...');
    console.log(`collectionEndpoint: ${collectionEndpoint}`);
    console.log(`indexName: ${indexName}`);

    const client = new Client({
        ...AwsSigv4Signer({
            region: AWS_REGION!,
            service: 'aoss',
            getCredentials: () => {
                const credentialsProvider = defaultProvider();
                return credentialsProvider();
            },
        }),
        node: collectionEndpoint,
    });

    console.log(JSON.stringify(client));
    try {
        const res = await client.indices.create({
            index: indexName,
            body: {
                settings: {
                    'index.knn': true,
                },
                mappings: {
                    properties: {
                        [`${indexName}-vector`]: {
                            type: 'knn_vector',
                            dimension: 1536,
                            method: {
                                name: 'hnsw',
                                engine: 'faiss',
                                parameters: {
                                    ef_construction: 512,
                                    m: 16,
                                },
                            }
                        },
                    }
                }
            },
        });

        console.log(JSON.stringify(res.body, null, 2));
    } catch (err) {
        console.error(JSON.stringify(err, null, 2));
    }
};