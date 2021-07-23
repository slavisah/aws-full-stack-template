import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import s3 = require('@aws-cdk/aws-s3');
import s3deploy = require('@aws-cdk/aws-s3-deployment');
import { BlockPublicAccess } from '@aws-cdk/aws-s3';

export interface S3StackProps extends cdk.StackProps {
    websiteIndexDocument: string;
    websiteErrorDocument: string;
}

export class S3Stack extends cdk.Stack {

    public readonly sourceAssetBucket: s3.Bucket;
    public readonly websiteBucket: s3.Bucket;
    public readonly pipelineArtifactsBucket: s3.Bucket;

    constructor(scope: cdk.Construct, id: string, props: S3StackProps) {
        super(scope, id, props);

        /* Assets Source Bucket will be used as a codebuild source for the react code */
        this.sourceAssetBucket = new s3.Bucket(this, 'SourceAssetBucket', {
            bucketName: `aws-fullstack-template-source-assets-${getRandomInt(1000000)}`,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            versioned: true
        });

        /* Website Bucket is the target bucket for the react application */
        this.websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
            bucketName: `aws-fullstack-template-website-${getRandomInt(1000000)}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            websiteIndexDocument: props.websiteIndexDocument,
            websiteErrorDocument: props.websiteIndexDocument,
        });


        /* Pipleine Artifacts Bucket is used by CodePipeline during Builds */
        this.pipelineArtifactsBucket = new s3.Bucket(this, 'PipelineArtifactsBucket', {
            bucketName: `aws-fullstack-template-codepipeline-artifacts-${getRandomInt(1000000)}`,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
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
                resources: [
                    `${this.websiteBucket.bucketArn}/*`
                ],
                actions: ["s3:Get*"],
                principals: [new iam.AnyPrincipal]
            })
        );
    }
}

const getRandomInt = (max: number) => {
    return Math.floor(Math.random() * Math.floor(max));
}