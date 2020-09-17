#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ApiGatewayStack } from '../lib/stacks/apigateway/apigateway';
import { CdnStack } from '../lib/stacks/cdn/cdn';
import { CodeStack } from '../lib/stacks/code/code';
import { CognitoStack } from '../lib/stacks/cognito/cognito';
import { DatabaseStack } from '../lib/stacks/database/database';
import { LambdaStack } from '../lib/stacks/lambda/lambda';
import { S3Stack } from '../lib/stacks/s3/s3';

const app = new cdk.App();

const commonProps = {
    org: 'full-stack-org',
    env: { account: '205892658956', region: 'us-west-2' }
};

const props = {
    environment: 'dev',
    useCdn: true,
    projectName: 'MyCDKGoals',
    tableName: 'CDKGoals',
    WebsiteIndexDocument: 'index.html',
    WebsiteErrorDocument: 'index.html',
    CdnWebsiteIndexDocument: 'index.html',
    ...commonProps
};


const DatabaseAppStack = new DatabaseStack(app, 'DatabaseAppStack', props);
const S3AppStack = new S3Stack(app, 'S3AppStack', props);
if(props.useCdn){
    const CdnAppStack = new CdnStack(app, 'CdnAppStack', S3AppStack.websiteBucket,  props);
}
const LambdaAppStack = new LambdaStack(app, 'LambdaAppStack', DatabaseAppStack.goalsTable, DatabaseAppStack.dynamoDbRole, props);
const CognitoAppStack = new CognitoStack(app, 'CognitoAppStack', props);
const ApiGatewayAppStack = new ApiGatewayStack(app, 'ApiGatewayAppStack', LambdaAppStack, CognitoAppStack, props);
const CodeAppStack = new CodeStack(app, 'CodeAppStack', CognitoAppStack, S3AppStack, ApiGatewayAppStack, props);

