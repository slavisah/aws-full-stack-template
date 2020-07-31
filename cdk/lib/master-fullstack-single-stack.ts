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
      bucketName: 'aws-fullstack-template-us-west-2',
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: this.WebsiteIndexDocument,
    });
    //#endregion

    /* Lambda Objects */
    //#region 
    const functionListGoals = new lambda.Function(this, 'FunctionListGoals', {
      functionName: `${this.ProjectName}-ListGoals`,
      runtime: lambda.Runtime.NODEJS_12_X,
      description: 'Get list of goals for userId',
      handler: 'ListGoals.handler',
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
      handler: 'CreateGoal.handler',
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
      handler: 'DeleteGoal.handler',
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
      handler: 'UpdateGoal.handler',
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
      handler: 'GetGoal.handler',
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

  }
}
