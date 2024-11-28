
import * as pulumi from "@pulumi/pulumi";

import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";
import { prefixed } from "../../utils/prefixed";
import { BastionEc2 } from "../../components/bastion-ec2";
import { LoadBalancerAlbPublic } from "../../components/lb-alb-public";
import { AppFargate } from "../../components/app-fargate";
import { CdnCloudFront } from "../../components/cdn-cloudfront";
import { PostgresRdsCluster } from "../../components/db-postgres-rds";
import { StorageS3 } from "../../components/storage-s3";

const vpc = new awsx.ec2.Vpc(prefixed('Vpc'), {
  enableDnsHostnames: true,
  enableDnsSupport: true,
});
const lb = new LoadBalancerAlbPublic('LoadBalancer', { vpc });

const storage = new StorageS3;
const db = new PostgresRdsCluster('Database', {
  vpc,
});
const cdn = new CdnCloudFront('CDN', {
  lb: lb.lb,
  storage: storage.bucket,
});
const appSecurityGroup = new aws.ec2.SecurityGroup('AppSecurityGroup', {
  vpcId: vpc.vpcId,
  ingress: [{
    protocol: 'tcp',
    fromPort: 3000,
    toPort: 3000,
    securityGroups: lb.lb.defaultSecurityGroup.apply(sg => [sg.id]),
  }],
  egress: [{
    protocol: 'tcp',
    fromPort: 0,
    toPort: 65535,
    cidrBlocks: ["0.0.0.0/0"],
  }],
});

new aws.ec2.SecurityGroupRule('PostgresAllowAppIngress', {
  securityGroupId: db.securityGroups[0]!.id,
  type: 'ingress',
  protocol: 'tcp',
  fromPort: 5432,
  toPort: 5432,
  sourceSecurityGroupId: appSecurityGroup.id,
});


const app = new AppFargate('App', {
  vpc,
  loadBalancer: lb.lb,
  cdnHostname: cdn.distribution.domainName,
  subnetIds: vpc.privateSubnetIds,
  connectionStringSecret: db.connectionStringSecret, 
  storage: storage.bucket,
  securityGroups: [appSecurityGroup]
});

const bastion = new BastionEc2('Bastion', { 
  vpc,
  securityGroups: [appSecurityGroup],
});

export const vpcId = vpc.vpcId;
export const service = app.service.service.name;
export const cdnHostname = pulumi.interpolate`https://${cdn.distribution.domainName}`;
export const objectStorageBucket = storage.bucket.bucket;
export const dbCluster = db.dbCluster.clusterIdentifier;
export const dbSecret = db.connectionStringSecret.arn;
export const bastionInstanceId = bastion.instance.id;
export const dbEndpoint = db.dbCluster.endpoint;
