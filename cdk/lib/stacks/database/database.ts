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

    private readonly props: DatabaseStackProps;

    constructor(scope: cdk.Construct, id: string, props: DatabaseStackProps) {
        super(scope, id, props);
        this.props = props;

        /* Dynamo Objects */
        //#region
        /* Create DynamoDB Goals Table */
        const goalsTable = new dynamodb.Table(this, 'TGoals', {
            tableName: `${props.projectName}-${props.tableName}`,
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

        const goalsPolicy = new iam.Policy(this, 'GoalsPolicy', {
            policyName: 'GoalsPolicy',
            roles: [dynamoDbRole],
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['dynamodb:*'],
                    resources: [goalsTable.tableArn]
                })
            ]
        });

        //#endregion


    }
}