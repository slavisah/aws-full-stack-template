import cdk = require('@aws-cdk/core');
import { Stack } from '@aws-cdk/core';
import iam = require('@aws-cdk/aws-iam');
import { CloudFrontWebDistribution, OriginAccessIdentity } from '@aws-cdk/aws-cloudfront'
import s3 = require('@aws-cdk/aws-s3');

export interface CdnStackProps extends cdk.StackProps {
    org: string,
    environment: string,
    CdnWebsiteIndexDocument: string
}

export class CdnStack extends Stack {

    constructor(scope: cdk.Construct, id: string, CdnWebsiteBucket: s3.Bucket, props: CdnStackProps) {
        super(scope, id, props);

        /* Cloudfront CDN Distribution */
        //#region 

        const assetsCdn = new CloudFrontWebDistribution(this, 'AssetsCDN', {
            defaultRootObject: props.CdnWebsiteIndexDocument,
            comment: `CDN for ${CdnWebsiteBucket}`,
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: CdnWebsiteBucket
                    },
                    behaviors: [{ isDefaultBehavior: true }]
                }
            ]
        });

        new cdk.CfnOutput(this, 'CloudFrontCDNUrl', { value: `http://${assetsCdn.distributionDomainName}` });
      
        //#endregion


    }
}