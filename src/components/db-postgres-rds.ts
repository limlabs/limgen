import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as random from "@pulumi/random";
import { prefixed } from "../utils/prefixed";
import { deepMerge } from "../utils/deep-merge";

export interface PostgresRdsClusterArgs {
  vpc: awsx.ec2.Vpc;
  securityGroups?: aws.ec2.SecurityGroup[];
  subnetIds?: pulumi.Input<string[]>;
  ingressType?: "public" | "private";
  clusterConfig?: aws.rds.ClusterArgs;
  databaseConfigs?: (
    Omit<aws.rds.ClusterInstanceArgs, 'clusterIdentifier'>
    | aws.rds.ClusterInstanceArgs
  )[];
};

export const defaultPostgresRdsClusterArgs: PostgresRdsClusterArgs = {
  vpc: null as any,
  subnetIds: [],
  ingressType: "public",
  clusterConfig: {
    engine: aws.rds.EngineType.AuroraPostgresql,
    databaseName: "blog",
    masterUsername: "postgres",
    masterPassword: "",
    skipFinalSnapshot: false,
  },
  databaseConfigs: [
    {
      engine: aws.rds.EngineType.AuroraPostgresql,
      instanceClass: "db.t3.medium",
      publiclyAccessible: true,
    }
  ],
};

export class PostgresRdsCluster extends pulumi.ComponentResource {
  _args: PostgresRdsClusterArgs;

  vpc: awsx.ec2.Vpc;
  password?: pulumi.Input<string> | random.RandomPassword;
  dbCluster: aws.rds.Cluster;
  connectionStringSecret: aws.secretsmanager.Secret;
  databases: aws.rds.ClusterInstance[];
  securityGroups: aws.ec2.SecurityGroup[];
  subnetGroup: aws.rds.SubnetGroup;

  constructor(
    name: string = 'Database',
    args: PostgresRdsClusterArgs = defaultPostgresRdsClusterArgs,
    opts: pulumi.ComponentResourceOptions = {}
  ) {
    super("limgen:PostgresRdsClusterComponent", name, {}, opts);
    this._args = args;

    this.password = this.getPassword();
    this.vpc = this.getVpc();
    this.subnetGroup = this.getSubnetGroup();
    this.securityGroups = this.getSecurityGroups();
    this.dbCluster = this.getDbCluster();
    this.databases = this.getDatabases();
    this.connectionStringSecret = this.getConnectionStringSecret();

    this.registerOutputs({
      clusterIdentifier: this.dbCluster.clusterIdentifier,
      databaseEndpoint: this.databases[0].endpoint,
      databasePort: this.dbCluster.port,
      connectionStringSecretArn: this.connectionStringSecret.arn,
      securityGroups: this.securityGroups.map(sg => sg.id),
    });
  }
  getDbCluster(): aws.rds.Cluster {
    return new aws.rds.Cluster("DBCluster", deepMerge({
      clusterIdentifier: prefixed('cluster'),
      engine: aws.rds.EngineType.AuroraPostgresql,
      databaseName: 'postgres',
      masterUsername: "postgres",
      dbSubnetGroupName: this.subnetGroup.name,
      vpcSecurityGroupIds: this.securityGroups.map(sg => sg.id),
      skipFinalSnapshot: true,
    }, { 
      ...this._args.clusterConfig, 
      masterPassword: this.getPasswordValue() 
    }));
  }
  getDatabases(): aws.rds.ClusterInstance[] {
    if (this._args.databaseConfigs) {
      return this._args.databaseConfigs.map((config, index) => {
        return new aws.rds.ClusterInstance(`DBInstance-${index}`, deepMerge({
          dbSubnetGroupName: this.subnetGroup.name,
          clusterIdentifier: this.dbCluster.id,
          publiclyAccessible: true,
          identifier: prefixed(`db-instance-${index}`),
        }, {
          ...config,
          engine: aws.rds.EngineType.AuroraPostgresql,
        }));
      });
    }

    return [
      new aws.rds.ClusterInstance("DBInstance", {
        dbSubnetGroupName: this.subnetGroup.name,
        clusterIdentifier: this.dbCluster.id,
        engine: aws.rds.EngineType.AuroraPostgresql,
        publiclyAccessible: true,
        instanceClass: "db.t3.medium",
        identifier: prefixed('db-instance'),
      })
    ];
  }
  getSecurityGroups(): aws.ec2.SecurityGroup[] {
    return this._args.securityGroups ?? [
      new aws.ec2.SecurityGroup("DBIngressSecurityGroup", {
        vpcId: this.vpc.vpcId,
        ingress: [
          {
            protocol: "tcp",
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ["0.0.0.0/0"],
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
      })
    ]
  }
  getSubnetGroup(): aws.rds.SubnetGroup {
    return new aws.rds.SubnetGroup("PublicSubnetGroup", {
      name: prefixed('public-subnet-group'),
      subnetIds: this._args.subnetIds ?? this.vpc.publicSubnetIds,
    });
  }

  getVpc(): awsx.ec2.Vpc {
    if (!this._args.vpc) {
      throw new Error("VPC is required for RDS cluster");
    }

    return this._args.vpc;
  }

  private getPassword() {
    if (this._args.clusterConfig?.masterPassword) {
      return this._args.clusterConfig?.masterPassword
    }

    return new random.RandomPassword("DBPassword", {
      length: 24,
      special: false,
    })
  }

  private getConnectionStringSecret() {
    const connectionString = pulumi.interpolate`postgresql://${this.dbCluster.masterUsername}:${this.getPasswordValue()}@${this.dbCluster.endpoint}:${this.dbCluster.port}/${this.dbCluster.databaseName}`;
    const stack = pulumi.getStack();

    this.connectionStringSecret = new aws.secretsmanager.Secret("ConnectionString", {
      namePrefix: prefixed("connection-string"),
    });

    new aws.secretsmanager.SecretVersion("ConnectionStringVersion", {
      secretId: this.connectionStringSecret.id,
      secretString: connectionString,
      versionStages: ["AWSCURRENT"],
    });

    return this.connectionStringSecret;
  }

  private getPasswordValue() {
    return (this.password as pulumi.Output<string>)?.apply ? (this.password as pulumi.Output<string>) : (this.password as random.RandomPassword).result
  }
}