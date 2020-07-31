import * as cdk from '@aws-cdk/core';
import { RemovalPolicy } from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import s3 = require('@aws-cdk/aws-s3');
import lambda = require('@aws-cdk/aws-lambda');
import iam = require('@aws-cdk/aws-iam');
import cognito = require('@aws-cdk/aws-cognito');
import { UserPool, UserPoolClientIdentityProvider, CfnIdentityPool } from '@aws-cdk/aws-cognito';
import { FederatedPrincipal, PolicyDocument } from '@aws-cdk/aws-iam';
import { BlockPublicAccess, BucketPolicy } from '@aws-cdk/aws-s3';
import codecommit = require('@aws-cdk/aws-codecommit');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipelineactions = require('@aws-cdk/aws-codepipeline-actions');
import codebuild = require('@aws-cdk/aws-codebuild');

var path = require('path');


export class MasterFullStackSingleStack extends cdk.Stack {
  /*DynamoDb*/
  private readonly ProjectName: string = 'MyCDKGoals';
  private readonly TableName: string = 'CDKGoals';
  private readonly WebsiteIndexDocument: string = 'index.html';

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /* Dynamo Objects */
    //#region 
    /* Create DynamoDB Goals Table */
    const goalsTable = new dynamodb.Table(this, 'TGoals', {
      tableName: `${this.ProjectName}-${this.TableName}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'goalId', type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    /* Create DynamoDB Role/Policy */
    const dynamoDbRole = new iam.Role(this, 'DynamoDbRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    dynamoDbRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:*'],
      resources: [goalsTable.tableArn],
    }));
    //#endregion

    /* S3 Objects */
    //Todo - grant access to cloudfront user
    //#region 
    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: 'aws-fullstack-template-us-west-2-assets',
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: this.WebsiteIndexDocument,
    });

    const pipelineArtifactsBucket = new s3.Bucket(this, 'PipelineArtifactsBucket', {
      bucketName: 'aws-fullstack-template-us-west-2-artifacts',
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    //#endregion

    /* Lambda Objects */
    //#region 
    const functionListGoals = new lambda.Function(this, 'FunctionListGoals', {
      functionName: `${this.ProjectName}-ListGoals`,
      runtime: lambda.Runtime.NODEJS_12_X,
      description: 'Get list of goals for userId',
      handler: 'index.handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(120),
      role: dynamoDbRole,
      environment: { TABLE_NAME: goalsTable.tableName },
      code: lambda.Code.fromAsset(path.dirname('../functions/ListGoals.js')),
    });

    const functionCreateGoals = new lambda.Function(this, 'FunctionCreateGoal', {
      functionName: `${this.ProjectName}-CreateGoal`,
      runtime: lambda.Runtime.NODEJS_12_X,
      description: 'Create goal for user id',
      handler: 'index.handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(120),
      role: dynamoDbRole,
      environment: { TABLE_NAME: goalsTable.tableName },
      code: lambda.Code.fromAsset(path.dirname('../functions/CreateGoal.js')),
    });

    const functionDeleteGoal = new lambda.Function(this, 'FunctionDeleteGoal', {
      functionName: `${this.ProjectName}-DeleteGoal`,
      runtime: lambda.Runtime.NODEJS_12_X,
      description: 'Delete goal for user id',
      handler: 'index.handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(120),
      role: dynamoDbRole,
      environment: { TABLE_NAME: goalsTable.tableName },
      code: lambda.Code.fromAsset(path.dirname('../functions/DeleteGoal.js')),
    });

    const functionUpdateGoal = new lambda.Function(this, 'FunctionUpdateGoal', {
      functionName: `${this.ProjectName}-UpdateGoal`,
      runtime: lambda.Runtime.NODEJS_12_X,
      description: 'Update goal for user id',
      handler: 'index.handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(120),
      role: dynamoDbRole,
      environment: { TABLE_NAME: goalsTable.tableName },
      code: lambda.Code.fromAsset(path.dirname('../functions/UpdateGoal.js')),
    });

    const functionGetGoal = new lambda.Function(this, 'FunctionGetGoal', {
      functionName: `${this.ProjectName}-GetGoal`,
      runtime: lambda.Runtime.NODEJS_12_X,
      description: 'Get goal for user id',
      handler: 'index.handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(120),
      role: dynamoDbRole,
      environment: { TABLE_NAME: goalsTable.tableName },
      code: lambda.Code.fromAsset(path.dirname('../functions/GetGoal.js')),
    });

    goalsTable.grantReadWriteData(functionListGoals);
    goalsTable.grantReadWriteData(functionCreateGoals);
    goalsTable.grantReadWriteData(functionDeleteGoal);
    goalsTable.grantReadWriteData(functionUpdateGoal);
    goalsTable.grantReadWriteData(functionGetGoal);

    //#endregion

    /* Cognito Objects */
    //Todo: add api ad the end Invoke-API policy, set back to * if too difficult
    //#region 
    /* Cognito SNS Policy */
    const cognitoSnsRole = new iam.Role(this, 'CognitoSnsRole', {
      assumedBy: new iam.ServicePrincipal('cognito-idp.amazonaws.com')
    });
    cognitoSnsRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sns:publish'],
      resources: ['*']
    }));

    /* Cognito User Pool */
    const userPool = new UserPool(this, 'UserPool', {
      userPoolName: `${this.ProjectName}-UserPool`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
      },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: false,
        requireDigits: false,
        requireSymbols: false,
        requireUppercase: false
      },
      userVerification: {
        emailSubject: 'Your verification code',
        emailBody: 'Here is your verification code: {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
        smsMessage: 'Your username is {username}, Your verification code is {####}',
      }
    });

    /* User Pool Client */
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPoolClientName: `${this.ProjectName}-UserPoolClient`,
      generateSecret: false,
      userPool: userPool
    });

    /* Identity Pool */
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: `${this.ProjectName}Identity`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        { clientId: userPoolClient.userPoolClientId, providerName: userPool.userPoolProviderName }
      ]
    });

    /* Cognito Roles */
    /* Unauthorized Role/Policy */
    const unauthenticatedRole = new iam.Role(this, 'CognitoDefaultUnauthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
        'StringEquals': { 'cognito-identity.amazonaws.com:aud': identityPool.ref },
        'ForAnyValue:StringLike': { 'cognito-identity.amazonaws.com:amr': 'unauthenticated' },
      }, 'sts:AssumeRoleWithWebIdentity')
    });
    unauthenticatedRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'mobileanalytics:PutEvents',
        'cognito-sync:*'
      ],
      resources: ['*'],
    }));
    /* Authorized Role/Policy */
    const authenticatedRole = new iam.Role(this, 'CognitoDefaultAuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
        'StringEquals': { 'cognito-identity.amazonaws.com:aud': identityPool.ref },
        'ForAnyValue:StringLike': { 'cognito-identity.amazonaws.com:amr': 'authenticated' },
      }, 'sts:AssumeRoleWithWebIdentity'),
    });
    authenticatedRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'mobileanalytics:PutEvents',
        'cognito-sync:*',
        'cognito-identity:*'
      ],
      resources: ['*'],
    }));
    authenticatedRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'execute-api:Invoke'
      ],
      resources: [
        `arn:aws:execute-api:${process.env.CDK_DEFAULT_REGION}:${process.env.CDK_DEFAULT_ACCOUNT}:AppApi`
      ]
    }));
    /* Create Default Policy */
    const defaultPolicy = new cognito.CfnIdentityPoolRoleAttachment(this, 'DefaultValid', {
      identityPoolId: identityPool.ref,
      roles: {
        'unauthenticated': unauthenticatedRole.roleArn,
        'authenticated': authenticatedRole.roleArn
      }
    });

    //#endregion

    /* Code Objects */
    //Todo - uncomment and test (manually deploy for now)
    //#region 

    // /* Code Commit Repo */
    // const codeRepository = new codecommit.Repository(this, 'CodeRepository', {
    //   repositoryName: `${this.ProjectName}-WebAssets`
    // });

    // /* CodeBuild Role */
    // const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
    //   assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    // });
    // codeBuildRole.addToPolicy(new iam.PolicyStatement({
    //   effect: iam.Effect.ALLOW,
    //   actions: [
    //     's3:PutObject',
    //     's3:GetObject',
    //     's3:GetObjectVersion',
    //     's3:GetBucketVersioning'
    //   ],
    //   resources: [assetsBucket.bucketArn, pipelineArtifactsBucket.bucketArn]
    // }));
    // codeBuildRole.addToPolicy(new iam.PolicyStatement({
    //   effect: iam.Effect.ALLOW,
    //   actions: [
    //     'logs:CreateLogStream',
    //     'logs:PutLogEvents',
    //     'logs:CreateLogGroup',
    //     'cloudfront:CreateInvalidation'
    //   ],
    //   resources: ['*']
    // }));

    // /* Code Build Project */
    // const codeBuildProject = new codebuild.Project(this, 'CodeBuildProject', {
    //   projectName: `${this.ProjectName}-build`,
    //   description: `Building stage for ${this.ProjectName}.`,
    //   environment: {
    //     computeType: codebuild.ComputeType.SMALL,
    //     buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2
    //   },
    //   role: codeBuildRole,
    //   buildSpec: codebuild.BuildSpec.fromObject({
    //     version: '0.2',
    //     phases: {
    //       install: {
    //         commands: [
    //           'runtime-versions:',
    //           'nodejs: 10'
    //         ],
    //       },
    //       pre_build: {
    //         commands: [
    //           '- echo Installing NPM dependencies..',
    //           '- npm install\n'
    //         ],
    //       },
    //       build: {
    //         commands: [
    //           '- npm run build',
    //         ],
    //       },
    //       post_build: {
    //         commands: [
    //           '- echo Uploading to AssetsBucket...',
    //           `- aws s3 cp --recursive ./build s3://${assetsBucket}/`,
    //           `- aws s3 cp --cache-control=\"max-age=0, no-cache, no-store, must-revalidate\" ./build/service-worker.js s3://${assetsBucket}/`,
    //           `- aws s3 cp --cache-control=\"max-age=0, no-cache, no-store, must-revalidate\" ./build/index.html s3://${assetsBucket}/`,
    //           //`- aws cloudfront create-invalidation --distribution-id ${AssetsCDN} --paths /index.html /service-worker.js\n\nartifacts:\n  files:`,
    //           "- '**/*'\n  base-directory: build"
    //         ],
    //       },
    //     },
    //   }),
    //   timeout: cdk.Duration.minutes(5)
    // });
    // cdk.Tag.add(codeBuildProject, 'app-name', `${this.ProjectName}`);


    // /* CodePipeline Role */
    // const codePipelineRole = new iam.Role(this, 'CodePipelineRole', {
    //   assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
    // });
    // codePipelineRole.addToPolicy(new iam.PolicyStatement({
    //   effect: iam.Effect.ALLOW,
    //   actions: [
    //     'codecommit:GetBranch',
    //     'codecommit:GetCommit',
    //     'codecommit:UploadArchive',
    //     'codecommit:GetUploadArchiveStatus',
    //     'codecommit:CancelUploadArchive'
    //   ],
    //   resources: [codeRepository.repositoryArn]
    // }));
    // codePipelineRole.addToPolicy(new iam.PolicyStatement({
    //   effect: iam.Effect.ALLOW,
    //   actions: [
    //     's3:PutObject',
    //     's3:GetObject'
    //   ],
    //   resources: [pipelineArtifactsBucket.bucketArn]
    // }));
    // codePipelineRole.addToPolicy(new iam.PolicyStatement({
    //   effect: iam.Effect.ALLOW,
    //   actions: [
    //     'codebuild:BatchGetBuilds',
    //     'codebuild:StartBuild'
    //   ],
    //   resources: [codeBuildProject.projectArn]
    // }));

    // /* Code Pipeline Object */
    // const codePipeline = new codepipeline.Pipeline(this, 'CodePipeline', {
    //   pipelineName: `${this.ProjectName}-Assets-Pipeline`,
    //   role: codePipelineRole,
    //   artifactBucket: pipelineArtifactsBucket
    // });
    // const sourceOutput = new codepipeline.Artifact(`${this.ProjectName}-SourceArtifact`);
    // const sourceAction = new codepipelineactions.CodeCommitSourceAction({
    //   actionName: 'CodeCommit',
    //   repository: codeRepository,
    //   output: sourceOutput,
    //   branch: 'master'
    // });
    // codePipeline.addStage({
    //   stageName: 'Source',
    //   actions: [sourceAction],
    // });

    // const buildOutput = new codepipeline.Artifact(`${this.ProjectName}-BuildArtifact`);
    // const buildAction = new codepipelineactions.CodeBuildAction({
    //   actionName: 'build-and-deploy',
    //   project: codeBuildProject,
    //   input: sourceOutput,
    //   outputs: [buildOutput]
    // });
    // codePipeline.addStage({
    //   stageName: 'Build',
    //   actions: [buildAction]
    // });
    //#endregion
  }
}
