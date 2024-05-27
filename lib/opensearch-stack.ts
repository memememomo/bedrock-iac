import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Opensearch } from '../construct/opensearch';
import { EXPORT_NAME, PARAMS } from '../service/const';
import {bedrockRoleArn, customResourceRoleArn} from "../service/util";


export class OpenSearchStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // OpenSearch作成
        const openSearch = new Opensearch(this, 'Opensearch', {
            collectionName: PARAMS.OASS.COLLECTION_NAME,
            indexName: PARAMS.OASS.INDEX_NAME,
            bedrockRoleArn: bedrockRoleArn(this),
            customResourceRoleArn: customResourceRoleArn(this),
        });

        // コレクションARNをエクスポート
        new cdk.CfnOutput(this, 'CollectionArn', {
            value: openSearch.collectionArn,
            exportName: EXPORT_NAME.COLLECTION_ARN,
        });
        // コレクションエンドポイントをエクスポート
        new cdk.CfnOutput(this, 'CollectionEndpoint', {
            value: openSearch.collectionEndpoint,
            exportName: EXPORT_NAME.COLLECTION_ENDPOINT,
        });
    }
}