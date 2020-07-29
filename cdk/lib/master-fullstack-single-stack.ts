import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import iam = require('@aws-cdk/aws-iam');
import { RemovalPolicy } from '@aws-cdk/core';


export class MasterFullStackSingleStack extends cdk.Stack {

  /*DynamoDb*/
  private readonly ProjectName: string = 'MyGoalsProject';
  private readonly TableName: string = 'Goals';
  /*Lambda*/

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /* Create DynamoDB Goals Table */
    const goalsTable = new dynamodb.Table(this, 'TGoals', {
      tableName: `${this.ProjectName}-${this.TableName}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'goalId', type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: RemovalPolicy.DESTROY
    });

    /* Create DynamoDB Role/Policy */
    const dynamoDbRole = new iam.Role(this, 'DynamoDbRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    const goalsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:*'],
      resources: [goalsTable.tableArn]
    });
    dynamoDbRole.addToPolicy(goalsPolicy);
  
   
    

  }
}
