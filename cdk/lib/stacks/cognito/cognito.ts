import cdk = require('@aws-cdk/core');
import { Stack } from '@aws-cdk/core';

export interface CognitoStackProps extends cdk.StackProps {

}

export class CognitoStack extends Stack {

    constructor(scope: cdk.Construct, id: string, props: CognitoStackProps) {
        super(scope, id, props);

        
    }
}