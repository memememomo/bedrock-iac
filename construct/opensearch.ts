import { aws_opensearchserverless } from "aws-cdk-lib";import { PrincipalBase } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export type OpensearchProps = {
    collectionName: string;
    indexName: string;
    bedrockRoleArn: string;
    customResourceRoleArn: string;
};

export class Opensearch extends Construct {
    public readonly collectionArn: string;
    public readonly collectionEndpoint: string;

    constructor(scope: Construct, id: string, props: OpensearchProps) {
        super(scope, id);

        // OpenSearch Serverlessコレクションを作成(インデックスグループ)
        const collection = new aws_opensearchserverless.CfnCollection(
            this,
            "knowledgeBaseCollection",
            {
                name: props.collectionName,
                type: 'VECTORSEARCH', // ベクトル検索
                standbyReplicas: 'DISABLED', // スタンバイレプリカを無効化
            }
        );
        this.collectionArn = collection.attrArn;
        this.collectionEndpoint = collection.attrCollectionEndpoint;

        // 暗号化ポリシーを作成
        const collectionEncryptionPolicy =
            new aws_opensearchserverless.CfnSecurityPolicy(
                this,
                'KnowledgeBaseCollectionEncryptionPolicy',
                // KMSキーを指定して暗号化ポリシーを作成
                {
                    name: props.collectionName,
                    type: 'encryption',
                    policy: JSON.stringify({
                        Rules: [
                            {
                                ResourceType: 'collection',
                                Resource: [`collection/${collection.name}`]
                            },
                        ],
                        AWSOwnedKey: true,
                    }),
                }
            );

        // NOTE: コレクションを作成する前に、コレクションの名前と一致するリソースパターンを含む暗号化ポリシーを作成しておく必要がある
        // 暗号化ポリシー作成後にコレクションが作成されるように依存関係を設定する
        // @see https://docs.aws.amazon.com/ja_jp/opensearch-service/latest/developerguide/serverless-manage.html#serverless-create
        // @see https://docs.aws.amazon.com/ja_jp/opensearch-service/latest/developerguide/serverless-encryption.html
        collection.addDependency(
            collectionEncryptionPolicy
        );

        // ネットワークセキュリティポリシーを作成
        new aws_opensearchserverless.CfnSecurityPolicy(
            this,
            'KnowledgeBaseCollectionNetworkPolicy',
            {
                name: props.collectionName,
                type: 'network',
                policy: JSON.stringify([
                    {
                        Rules: [
                            {
                                ResourceType: 'collection',
                                Resource: [`collection/${collection.name}`]
                            },
                            {
                                ResourceType: 'dashboard',
                                Resource: [`collection/${collection.name}`]
                            }
                        ],
                        AllowFromPublic: true,
                    },
                ]),
            }
        );

        // アクセスポリシーを作成
        new aws_opensearchserverless.CfnAccessPolicy(
            this,
            'KnowledgeBaseCollectionAccessPolicy',
            {
                name: props.collectionName,
                type: 'data',
                policy: JSON.stringify([
                    {
                        Rules: [
                            {
                                ResourceType: 'collection',
                                Resource: [`collection/${collection.name}`],
                                Permission: ['aoss:*'],
                            },
                            {
                                ResourceType: 'index',
                                Resource: [`index/${collection.name}/*`],
                                Permission: ['aoss:*'],
                            },
                        ],
                        // Bedrockとカスタムリソースのロールに対してアクセス許可を付与
                        Principal: [
                            props.bedrockRoleArn,
                            props.customResourceRoleArn,
                        ],
                    },
                ]),
            }
        );
    }
}