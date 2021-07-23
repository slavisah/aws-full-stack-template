import { CloudFrontWebDistribution, OriginAccessIdentity } from '@aws-cdk/aws-cloudfront';
import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3'; 

export interface CdnStackProps extends cdk.StackProps {
    cdnWebsiteIndexDocument: string;
}

export class CdnStack extends cdk.Stack {

    constructor(scope: cdk.Construct, id: string, websiteBucket: s3.Bucket, props: CdnStackProps) {
        super(scope, id, props);

        const assetsCdn = new CloudFrontWebDistribution(this, 'AssetsCDN', {
            defaultRootObject: props.cdnWebsiteIndexDocument,
            comment: `CDN for ${websiteBucket}`,
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: websiteBucket,
                        // There is a current but in CDK by which OAE's create a circular dependency
                        // Amazon is aware of this.  The OAE is not required to run the demo app.
                        // originAccessIdentity: new cf.OriginAccessIdentity(this, 'WebsiteBucketOriginAccessIdentity', {
                        //     comment: `OriginAccessIdentity for ${websiteBucket}`
                        // }),
                    },
                    behaviors: [{ isDefaultBehavior: true }]
                }
            ]
        });
    }

}