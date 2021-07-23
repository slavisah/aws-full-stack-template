import cdk = require('@aws-cdk/core');
import { Stack, RemovalPolicy } from '@aws-cdk/core';
import iam = require('@aws-cdk/aws-iam');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipelineactions = require('@aws-cdk/aws-codepipeline-actions');
import codebuild = require('@aws-cdk/aws-codebuild');
import { CognitoStack } from '../cognito/cognito';
import { S3Stack } from '../s3/s3';
import { ApiGatewayStack } from '../apigateway/apigateway';

export interface CodeStackProps extends cdk.StackProps {
    projectName: string
}

export class CodeStack extends Stack {

    constructor(scope: cdk.Construct, id: string, cognitoAppStack: CognitoStack, s3AppStack: S3Stack, apiGatewayAppStack: ApiGatewayStack, props: CodeStackProps) {
        super(scope, id, props);

        /* CodeBuild Roles/Policies */
        //#region 
        const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
            roleName: 'CodeBuildRole',
            assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
        });

        codeBuildRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['s3:*'],
            resources: [
                s3AppStack.sourceAssetBucket.bucketArn,
                s3AppStack.pipelineArtifactsBucket.bucketArn,
                s3AppStack.websiteBucket.bucketArn,
                `${s3AppStack.websiteBucket.bucketArn}/*`
            ]
        }));

        codeBuildRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['logs:CreateLogStream', 'logs:PutLogEvents', 'logs:CreateLogGroup', 'cloudfront:CreateInvalidation'],
            resources: ['*'],
        }));

        const codePipelineRole = new iam.Role(this, 'CodePipelineRole', {
            roleName: 'CodePipelineRole',
            assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com')
        });

        codePipelineRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['s3:*'],
            resources: [
                s3AppStack.sourceAssetBucket.bucketArn,
                s3AppStack.pipelineArtifactsBucket.bucketArn,
                s3AppStack.websiteBucket.bucketArn,
                `${s3AppStack.websiteBucket.bucketArn}/*`
            ]
        }));

        //#endregion

        /* CodeBuild Pipeline Project */
        //#region 
        const codeBuildProject = new codebuild.PipelineProject(this, 'CodeBuildProject', {
            projectName: `${props.projectName}-build`,
            description: `CodeBuild Project for ${props.projectName}.`,
            environment: {
                computeType: codebuild.ComputeType.SMALL,
                buildImage: codebuild.LinuxBuildImage.STANDARD_3_0,
                environmentVariables: {
                    API_GATEWAY_REGION: { value: cdk.Aws.REGION },
                    API_GATEWAY_URL: { value: apiGatewayAppStack.appApi.url.slice(0, -1) },
                    COGNITO_REGION: { value: cdk.Aws.REGION },
                    COGNITO_USER_POOL_ID: { value: cognitoAppStack.userPool.userPoolId },
                    COGNITO_APP_CLIENT_ID: { value: cognitoAppStack.userPoolClient.userPoolClientId },
                    COGNITO_IDENTITY_POOL_ID: { value: cognitoAppStack.identityPool.ref },
                    WEBSITE_BUCKET: { value: s3AppStack.websiteBucket.bucketName }
                }
            },
            role: codeBuildRole,
            buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
            timeout: cdk.Duration.minutes(5),
        });
        cdk.Tags.of(codeBuildProject).add('app-name', `${props.projectName}`);

        codePipelineRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
            resources: [codeBuildProject.projectArn],
        }));

        //#endregion

        /* Code Pipeline Object */
        //#region 
        const sourceOutput = new codepipeline.Artifact(`${props.projectName}-SourceArtifact`);
        const buildOutput = new codepipeline.Artifact(`${props.projectName}-BuildArtifact`);

        const codePipeline = new codepipeline.Pipeline(this, 'AssetsCodePipeline', {
            pipelineName: `${props.projectName}-Assets-Pipeline`,
            role: codePipelineRole,
            artifactBucket: s3AppStack.pipelineArtifactsBucket,
            stages: [
                {
                    stageName: 'Source',
                    actions: [
                        new codepipelineactions.S3SourceAction({
                            actionName: 's3Source',
                            bucket: s3AppStack.sourceAssetBucket,
                            bucketKey: 'assets.zip',
                            output: sourceOutput,
                            //trigger: codepipelineactions.S3Trigger.POLL
                        }),
                    ],
                },
                {
                    stageName: 'Build',
                    actions: [
                        new codepipelineactions.CodeBuildAction({
                            actionName: 'build-and-deploy',
                            project: codeBuildProject,
                            input: sourceOutput,
                            outputs: [buildOutput]
                        }),
                    ],
                }
            ],
        });
        //#endregion


    }
}