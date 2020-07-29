import * as cdk from '@aws-cdk/core';
import lambda = require('@aws-cdk/aws-lambda');
import { Duration } from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import { BucketAccessControl } from '@aws-cdk/aws-s3';

export interface MasterProps extends cdk.StackProps {
  projectName: string;
}

export class MasterFullStackSingleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: MasterProps) {
    super(scope, id, props);

    const lambdaBucket = new s3.Bucket(this, 'AssetsBucket', {
      accessControl: BucketAccessControl.PRIVATE,
      // metricsConfigurations: [
      //   {
      //     "id": "EntireBucket"
      //   }
      // ],
      // websiteConfiguration: {
      //   "indexDocument": "index.html"
      // },
  });

    new lambda.Function(this, 'FunctionListGoals', {
      functionName: `${props.projectName}-ListGoals`,
      runtime: lambda.Runtime.NODEJS_12_X,
      description: 'Get list of goals for userId',
      handler: 'index.handler',
      memorySize: 256,
      timeout: Duration.seconds(120),
      //role
      //environment
      // fix this key
      code: lambda.S3Code.fromBucket(lambdaBucket, "key")
    });
  }
}
