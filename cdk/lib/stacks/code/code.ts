import cdk = require('@aws-cdk/core');
import { Stack } from '@aws-cdk/core';

export interface CodeStackProps extends cdk.StackProps {

}

export class CodeStack extends Stack {

    constructor(scope: cdk.Construct, id: string, props: CodeStackProps) {
        super(scope, id, props);

        
    }
}