import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

export interface FullstackServiceAWSArgs {
  cdnHostname?: pulumi.Input<string>;
  repositoryUrl?: pulumi.Input<string>;
  mediaBucket?: aws.s3.BucketV2;
  connectionStringSecret?: aws.secretsmanager.Secret;
  connectionStringEnvironmentVariableName?: pulumi.Input<string>;
  ecrRepository?: awsx.ecr.Repository | null;
  taskRole?: aws.iam.Role;
  executionRole?: aws.iam.Role;
  cluster?: aws.ecs.Cluster;
  vpc: awsx.ec2.Vpc;
  subnetIds?: pulumi.Input<string>[];
  securityGroups?: aws.ec2.SecurityGroup[];
  imageArgs?: awsx.ecr.ImageArgs;
  serviceArgs?: awsx.ecs.FargateServiceArgs;
  loadBalancer?: awsx.lb.ApplicationLoadBalancer;
}

export const defaultFullstackServiceAWSArgs: FullstackServiceAWSArgs = {
  mediaBucket: null as any,
  connectionStringEnvironmentVariableName: "DATABASE_URL",
  connectionStringSecret: null as any,
  cluster: null as any,
  vpc: null as any,
  subnetIds: null as any,
  securityGroups: null as any,
  taskRole: null as any,
  executionRole: null as any,
  ecrRepository: null as any,
};

export class AppFargate extends pulumi.ComponentResource {
  _args: FullstackServiceAWSArgs;
  _stack: string;

  cluster: aws.ecs.Cluster;
  executionRole: aws.iam.Role;
  taskRole: aws.iam.Role;
  ecrRepository: awsx.ecr.Repository | null;
  image: awsx.ecr.Image;
  service: awsx.ecs.FargateService;
  securityGroupIds: (string|pulumi.Output<string>)[];

  constructor(name: string = 'App', args: FullstackServiceAWSArgs, opts?: pulumi.ComponentResourceOptions) {
    super("limgen:EcsClusterComponent", name, {}, opts);
    this._args = Object.assign({}, defaultFullstackServiceAWSArgs, args);
    this._stack = pulumi.getStack();
    this.cluster = this.getCluster();
    this.executionRole = this.getExecutionRole();
    this.taskRole = this.getTaskRole();
    this.ecrRepository = this.getEcrRepository();
    this.image = this.getImage();
    this.securityGroupIds = this.getSecurityGroups();
    this.service = this.getService();

    this.registerOutputs({});
  }
  getSecurityGroups(): (string|pulumi.Output<string>)[] {
    if (this._args.securityGroups) {
      return this._args.securityGroups.map(sg => sg.id);
    }

    if (!this._args.loadBalancer) {
      throw new Error("No security groups provided and no load balancer to derive them from");
    }

    if (!this._args.loadBalancer.defaultSecurityGroup) {
      throw new Error("No security groups provided and load balancer has no default security group");
    }

    const appSecurityGroup = new aws.ec2.SecurityGroup("AppSecurityGroup", {
      vpcId: this._args.vpc.vpcId,
      ingress: [
        {
          protocol: "tcp",
          fromPort: 3000,
          toPort: 3000,
          securityGroups: [this._args.loadBalancer.defaultSecurityGroup.apply(sg => sg!.id)],
        }
      ],
      egress: [
        {
          protocol: "tcp",
          fromPort: 0,
          toPort: 65535,
          cidrBlocks: ["0.0.0.0/0"],
        }
      ],
    });

    return [appSecurityGroup.id];
  }
  getService(): awsx.ecs.FargateService {
    const environmentParams: awsx.types.input.ecs.TaskDefinitionKeyValuePairArgs[] = [];

    if (this._args.cdnHostname) {
      environmentParams.push({
        name: "CDN_URL",
        value: pulumi.interpolate`https://${this._args.cdnHostname}`,
      });
    }

    if (this._args.mediaBucket) {
      environmentParams.push({
        name: "BUCKET_NAME",
        value: this._args.mediaBucket.bucket,
      });
    }

    const secrets: awsx.types.input.ecs.TaskDefinitionSecretArgs[] = [];
    if (this._args.connectionStringSecret) {
      secrets.push({
        name: "DATABASE_URL",
        valueFrom: this._args.connectionStringSecret.arn,
      });
    }

    const networkConfiguration: aws.types.input.ecs.ServiceNetworkConfiguration = {
      subnets: this._args.subnetIds ?? this._args.vpc.publicSubnetIds,
      assignPublicIp: true,
      securityGroups: this.securityGroupIds
    };

    const loadBalancers: aws.types.input.ecs.ServiceLoadBalancer[] = [];
    if (this._args.loadBalancer) {
      loadBalancers.push({
        containerName: this.getContainerName(),
        containerPort: 3000,
        targetGroupArn: this._args.loadBalancer.defaultTargetGroup.arn,
      });
    }

    const taskDefinitionArgs: awsx.types.input.ecs.FargateServiceTaskDefinitionArgs = {
      taskRole: {
        roleArn: this.taskRole.arn,
      },
      executionRole: {
        roleArn: this.executionRole.arn,
      },
      container: {
        name: this.getContainerName(),
        image: this.image.imageUri,
        cpu: 256,
        memory: 512,
        essential: true,
        portMappings: [{
          hostPort: 3000,
          containerPort: 3000,
        }],
        environment: environmentParams,
        secrets,
      },
    };
  
    return new awsx.ecs.FargateService("service", {
      name: pulumi.interpolate`${pulumi.getProject()}-${this._stack}-app`,
      cluster: this.cluster.arn,
      networkConfiguration,
      loadBalancers,
      taskDefinitionArgs
    });
  }
  getImage(): awsx.ecr.Image {
    if (this._args.repositoryUrl) {
      return new awsx.ecr.Image("image", {
        repositoryUrl: this._args.repositoryUrl,
        platform: "linux/amd64",
        ...this._args.imageArgs,
      });
    }

    if (!this.ecrRepository) {
      throw new Error("No docker registry URL or repository provided");
    }

    const buildArgs: {[key: string]: pulumi.Input<string>} = {};
    if (this._args.cdnHostname) {
      buildArgs.INPUT_CDN_URL = pulumi.interpolate`https://${this._args.cdnHostname}`;
    }

    return new awsx.ecr.Image("image", {
      repositoryUrl: this.ecrRepository.url,
      context: "..",
      args: buildArgs,
      platform: "linux/amd64",
      ...this._args.imageArgs,
    });
  }
  getEcrRepository(): awsx.ecr.Repository | null {
    if (this._args.repositoryUrl) {
      return null;
    }

    if (this._args.ecrRepository) {
      return this._args.ecrRepository;
    }

    return new awsx.ecr.Repository("repo", {
      name: pulumi.interpolate`blog-${this._stack}`,
      forceDelete: true,
    });
  }
  getTaskRole(): aws.iam.Role {
    if (this._args.taskRole) {
      return this._args.taskRole;
    }

    const taskRole = new aws.iam.Role("AppTaskRole", {
      name: pulumi.interpolate`blog-${this._stack}-app-task-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ecs-tasks.amazonaws.com",
            },
          },
        ],
      }),
    });

    if (this._args.mediaBucket) {
      new aws.iam.RolePolicy("TaskRolePolicy", {
        name: pulumi.interpolate`blog-${this._stack}-app-task-role-policy`,
        role: taskRole,
        policy: {
          Version: "2012-10-17",
          Statement: [
            {
              Action: [
                "s3:PutObject",
                "s3:PutObjectAcl",
              ],
              Effect: "Allow",
              Resource: [pulumi.interpolate`${this._args.mediaBucket.arn}/*`],
            }
          ],
        }
      });
    }

    return taskRole;
  }
  getCluster(): aws.ecs.Cluster {
    if (this._args.cluster) {
      return this._args.cluster;
    }

    return new aws.ecs.Cluster("cluster", {
      name: pulumi.interpolate`blog-${this._stack}-cluster`,
    });
  }
  getExecutionRole(): aws.iam.Role {
    if (this._args.executionRole) {
      return this._args.executionRole;
    }

    const executionRole = new aws.iam.Role("AppExecutionRole", {
      name: pulumi.interpolate`blog-${this._stack}-app-execution-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ecs-tasks.amazonaws.com",
            },
          },
        ],
      }),
    });

    new aws.iam.PolicyAttachment("AppExecutionRoleAttachment", {
      policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
      roles: [executionRole],
    });

    if (this._args.connectionStringSecret) {
      new aws.iam.RolePolicy("ExecutionRolePolicy", {
        role: this.executionRole,
        name: pulumi.interpolate`blog-${this._stack}-app-execution-role-policy`,
        policy: this._args.connectionStringSecret.arn.apply(arn => JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Action: "secretsmanager:GetSecretValue",
              Effect: "Allow",
              Resource: [arn],
            },
          ],
        })),
      });
    }

    return executionRole;
  }

  getContainerName(): pulumi.Output<string> {
    return pulumi.interpolate`${pulumi.getProject()}-${this._stack}-app`;
  }
}
