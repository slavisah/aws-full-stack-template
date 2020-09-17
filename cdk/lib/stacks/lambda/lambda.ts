import cdk = require('@aws-cdk/core');
import { Stack } from '@aws-cdk/core';

export interface LambdaStackProps extends cdk.StackProps {

}

export class LambdaStack extends Stack {

    constructor(scope: cdk.Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);

        
    }
}