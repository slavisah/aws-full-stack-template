import cdk = require('@aws-cdk/core');
import { Stack } from '@aws-cdk/core';

export interface ApiGatewayStackProps extends cdk.StackProps {

}

export class ApiGatewayStack extends Stack {

    constructor(scope: cdk.Construct, id: string, props: ApiGatewayStackProps) {
        super(scope, id, props);

        
    }
}