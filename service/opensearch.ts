import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';

type CreateIndexParams = {
    region: string;
    host: string;
    indexName: string;
};

export const createIndex = async (params: CreateIndexParams) => {
    const { host, indexName } = params;
    console.log(`Creating index ${indexName} on ${host}`);
    await new Promise((resolve) => setTimeout(resolve, 60000));

    const client = new Client({
        ...AwsSigv4Signer({
            region: params.region,
            service: 'aoss',
            getCredentials() {
                const credentialsProvider = defaultProvider();
                return  credentialsProvider();
            },
        }),
        node: host,
    });

    console.log(JSON.stringify(client));

    try {
        const res = await client.indices.create({
            index: params.indexName,
            body: {
                settings: {
                    'index.knn': true,
                },
                mappings: {
                    properties: {
                        'bedrock-vector': {
                            type: 'knn_vector',
                            dimension: 1536,
                            method: {
                                name: 'hnsw',
                                engine: 'faiss',
                                parameters: {
                                    ef_construction: 512,
                                    m: 16,
                                }
                            }
                        },
                    },
                }
            }
        });

        console.log(JSON.stringify(res.body, null, 2));
    } catch (err) {
        console.error(JSON.stringify(err, null, 2));
    }
};