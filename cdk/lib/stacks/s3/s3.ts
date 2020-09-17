import cdk = require('@aws-cdk/core');
import { Stack, RemovalPolicy } from '@aws-cdk/core';
import iam = require('@aws-cdk/aws-iam');
import s3 = require('@aws-cdk/aws-s3');
import s3deploy = require('@aws-cdk/aws-s3-deployment');

export interface S3StackProps extends cdk.StackProps {
    WebsiteIndexDocument: string;
    WebsiteErrorDocument: string;
}

export class S3Stack extends Stack {

    public readonly sourceAssetBucket: s3.Bucket;
    public readonly websiteBucket: s3.Bucket;
    public readonly pipelineArtifactsBucket: s3.Bucket;

    constructor(scope: cdk.Construct, id: string, props: S3StackProps) {
        super(scope, id, props);

        /* S3 Objects */
        //#region
        /* Assets Source Bucket will be used as a codebuild source for the react code */
        this.sourceAssetBucket = new s3.Bucket(this, 'SourceAssetBucket', {
            bucketName: `aws-fullstack-template-source-assets-${getRandomInt(1000000)}`,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: RemovalPolicy.DESTROY,
            versioned: true
        });

        /* Website Bucket is the target bucket for the react application */
        this.websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
            bucketName: `aws-fullstack-template-website-${getRandomInt(1000000)}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            websiteIndexDocument: props.WebsiteIndexDocument,
            websiteErrorDocument: props.WebsiteErrorDocument,
        });

        /* Pipleine Artifacts Bucket is used by CodePipeline during Builds */
        this.pipelineArtifactsBucket = new s3.Bucket(this, 'PipelineArtifactsBucket', {
            bucketName: `aws-fullstack-template-codepipeline-artifacts-${getRandomInt(1000000)}`,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        /* S3 Website Deployment */
        /* Seed the website bucket with the react source */
        const s3WebsiteDeploy = new s3deploy.BucketDeployment(this, 'S3WebsiteDeploy', {
            sources: [s3deploy.Source.asset('../assets/archive')],
            destinationBucket: this.sourceAssetBucket
        });

        /* Set Website Bucket Allow Policy */
        this.websiteBucket.addToResourcePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["s3:Get*"],
                resources: [
                    `${this.websiteBucket.bucketArn}/*`
                ],             
                principals: [new iam.AnyPrincipal]
            })
        );
        //#endregion
    }
}

const getRandomInt = (max: number) => {
    return Math.floor(Math.random() * Math.floor(max));
}