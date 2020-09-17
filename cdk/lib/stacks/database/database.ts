import cdk = require('@aws-cdk/core');
import { Stack, RemovalPolicy } from '@aws-cdk/core';
import iam = require('@aws-cdk/aws-iam');
import * as dynamodb from '@aws-cdk/aws-dynamodb';

export interface DatabaseStackProps extends cdk.StackProps {
    org: string,
    environment: string,
    projectName: string,
    tableName: string,
}

export class DatabaseStack extends Stack {

    public readonly goalsTable: dynamodb.Table;
    public readonly dynamoDbRole: iam.Role;

    constructor(scope: cdk.Construct, id: string, props: DatabaseStackProps) {
        super(scope, id, props);

        /* Dynamo Objects */
        //#region
        /* Create DynamoDB Goals Table */
        this.goalsTable = new dynamodb.Table(this, 'TGoals', {
            tableName: `${props.projectName}-${props.tableName}`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'goalId', type: dynamodb.AttributeType.STRING },
            readCapacity: 1,
            writeCapacity: 1,
            removalPolicy: RemovalPolicy.DESTROY,
        });

        /* Create DynamoDB Role/Policy */
        this.dynamoDbRole = new iam.Role(this, 'DynamoDbRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        });

        const goalsPolicy = new iam.Policy(this, 'GoalsPolicy', {
            policyName: 'GoalsPolicy',
            roles: [this.dynamoDbRole],
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['dynamodb:*'],
                    resources: [this.goalsTable.tableArn]
                })
            ]
        });

        //#endregion


    }
}