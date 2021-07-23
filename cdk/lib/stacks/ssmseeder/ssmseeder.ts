import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import ssm = require('@aws-cdk/aws-ssm');

export class SsmSeederStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //  Environment List: 'dev-local', 'dev-integration', 'test', 'stg', 'load', 'prod'
    let envList = ['Dev-local', 'Dev-integration'];
    let envParent = 'CdkEnvs';

    const defaultEnv = new ssm.StringParameter(this, `${envParent}-Default-env`, { parameterName: `/${envParent}/Default-env`, stringValue: 'Dev-local' });

    for (let env of envList) {
      new ssm.StringParameter(this, `${envParent}-${env}-apiName`, { parameterName: `/${envParent}/${env}/apiName`, stringValue: 'apiGw' });
      new ssm.StringParameter(this, `${envParent}-${env}-apiResourceName`, { parameterName: `/${envParent}/${env}/apiResourceName`, stringValue: 'res' });
      new ssm.StringParameter(this, `${envParent}-${env}-authorizorName`, { parameterName: `/${envParent}/${env}/authorizorName`, stringValue: 'apiAuthorizer' });
      new ssm.StringParameter(this, `${envParent}-${env}-cdnComment`, { parameterName: `/${envParent}/${env}/cdnComment`, stringValue: 'CDN' });
      new ssm.StringParameter(this, `${envParent}-${env}-cdnWebsiteIndexDocument`, { parameterName: `/${envParent}/${env}/cdnWebsiteIndexDocument`, stringValue: 'index.html' });
      new ssm.StringParameter(this, `${envParent}-${env}-codeBuildRoleName`, { parameterName: `/${envParent}/${env}/codeBuildRoleName`, stringValue: 'CodeBuildRole' });
      new ssm.StringParameter(this, `${envParent}-${env}-codePipelineRoleName`, { parameterName: `/${envParent}/${env}/codePipelineRoleName`, stringValue: 'CodePipelineRole' });
      new ssm.StringParameter(this, `${envParent}-${env}-identityPoolName`, { parameterName: `/${envParent}/${env}/identityPoolName`, stringValue: 'Identity' });
      new ssm.StringParameter(this, `${envParent}-${env}-partitionKeyName`, { parameterName: `/${envParent}/${env}/partitionKeyName`, stringValue: 'userId' });
      new ssm.StringParameter(this, `${envParent}-${env}-pipelineProjectBuildSpec`, { parameterName: `/${envParent}/${env}/pipelineProjectBuildSpec`, stringValue: 'buildspec.yml' });
      new ssm.StringParameter(this, `${envParent}-${env}-pipelineProjectDescription`, { parameterName: `/${envParent}/${env}/pipelineProjectDescription`, stringValue: 'CodeBuild Project' });
      new ssm.StringParameter(this, `${envParent}-${env}-pipelineProjectName`, { parameterName: `/${envParent}/${env}/pipelineProjectName`, stringValue: 'build' });
      new ssm.StringParameter(this, `${envParent}-${env}-s3WebsiteDeploySource`, { parameterName: `/${envParent}/${env}/s3WebsiteDeploySource`, stringValue: '../assets/archive' });
      new ssm.StringParameter(this, `${envParent}-${env}-sortKeyName`, { parameterName: `/${envParent}/${env}/sortKeyName`, stringValue: 'sortId' });
      new ssm.StringParameter(this, `${envParent}-${env}-tableName`, { parameterName: `/${envParent}/${env}/tableName`, stringValue: 'Table' });
      new ssm.StringParameter(this, `${envParent}-${env}-userPoolClientName`, { parameterName: `/${envParent}/${env}/userPoolClientName`, stringValue: 'UserPoolClient' });
      new ssm.StringParameter(this, `${envParent}-${env}-userPoolName`, { parameterName: `/${envParent}/${env}/userPoolName`, stringValue: 'UserPool' });
      new ssm.StringParameter(this, `${envParent}-${env}-websiteErrorDocument`, { parameterName: `/${envParent}/${env}/websiteErrorDocument`, stringValue: 'index.html' });
      new ssm.StringParameter(this, `${envParent}-${env}-websiteIndexDocument`, { parameterName: `/${envParent}/${env}/websiteIndexDocument`, stringValue: 'index.html' });
    };

    // Grant read access to some Role
    //param.grantRead(role);
  }
}
