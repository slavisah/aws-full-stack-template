import cdk = require('@aws-cdk/core');
import { Stack, RemovalPolicy } from '@aws-cdk/core';
import iam = require('@aws-cdk/aws-iam');
import { RestApi, LambdaIntegration, IResource, MockIntegration, PassthroughBehavior, CfnAuthorizer, AuthorizationType } from '@aws-cdk/aws-apigateway';
import { LambdaStack } from '../lambda/lambda';
import { CognitoStack } from '../cognito/cognito';

export interface ApiGatewayStackProps extends cdk.StackProps {
    org: string,
    environment: string,
    projectName: string
}

export class ApiGatewayStack extends Stack {

  public readonly appApi: RestApi;

    constructor(scope: cdk.Construct, id: string, lambdaAppStack: LambdaStack, cognitoAppStack: CognitoStack, props: ApiGatewayStackProps) {
        super(scope, id, props);

         /* Api Gateway */
    //#region
    this.appApi = new RestApi(this, 'AppApi', {
        restApiName: props.projectName,
      });
  
      const authorizer = new CfnAuthorizer(this, 'ApiAuthorizer', {
        restApiId: this.appApi.restApiId,
        name: 'ApiAuthorizer',
        type: 'COGNITO_USER_POOLS',
        identitySource: 'method.request.header.Authorization',
        providerArns: [cognitoAppStack.userPool.userPoolArn]
      });
  
  
      this.appApi.root.addMethod('ANY');
  
      const items = this.appApi.root.addResource('goals');
      const getAllIntegration = new LambdaIntegration(lambdaAppStack.functionListAllGoals);
      items.addMethod('GET', getAllIntegration, {
        authorizationType: AuthorizationType.IAM,
        authorizer: { authorizerId: authorizer.ref }
      });
  
      const createOneIntegration = new LambdaIntegration(lambdaAppStack.functionCreateGoal);
      items.addMethod('POST', createOneIntegration, {
        authorizationType: AuthorizationType.IAM,
        authorizer: { authorizerId: authorizer.ref }
      });
      addCorsOptions(items);
  
      const singleItem = items.addResource('{id}');
      const getOneIntegration = new LambdaIntegration(lambdaAppStack.functionGetGoal);
      singleItem.addMethod('GET', getOneIntegration, {
        authorizationType: AuthorizationType.IAM,
        authorizer: { authorizerId: authorizer.ref }
      });
  
      const updateOneIntegration = new LambdaIntegration(lambdaAppStack.functionUpdateGoal);
      singleItem.addMethod('PUT', updateOneIntegration, {
        authorizationType: AuthorizationType.IAM,
        authorizer: { authorizerId: authorizer.ref }
      });
  
      const deleteOneIntegration = new LambdaIntegration(lambdaAppStack.functionDeleteGoal);
      singleItem.addMethod('DELETE', deleteOneIntegration, {
        authorizationType: AuthorizationType.IAM,
        authorizer: { authorizerId: authorizer.ref }
      });
      addCorsOptions(singleItem);
  
      //#endregion
  
        
    }
}

export function addCorsOptions(apiResource: IResource) {
    apiResource.addMethod('OPTIONS', new MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Credentials': "'false'",
          'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
        },
      }],
      passthroughBehavior: PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": "{\"statusCode\": 200}"
      },
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }]
    })
  }