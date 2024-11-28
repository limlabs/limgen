
import * as pulumi from "@pulumi/pulumi";
<% if (networkType === 'public') { %>
import { VpcPublic } from "../../components/vpc-public";<% } else { %>
import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";
import { prefixed } from "../../utils/prefixed";<% } %><% if (networkType === 'private' && includeDb) { %>
import { BastionEc2 } from "../../components/bastion-ec2";<% } %>
import { LoadBalancerAlbPublic } from "../../components/lb-alb-public";
import { AppFargate } from "../../components/app-fargate";
import { CdnCloudFront } from "../../components/cdn-cloudfront";<% if (includeDb) { %>
import { PostgresRdsCluster } from "../../components/db-postgres-rds";<% } %><% if (includeStorage) { %>
import { StorageS3 } from "../../components/storage-s3";<% } %>
<% if (networkType === 'public') { %>
const { vpc } = new VpcPublic;<% } else { %>
const vpc = new awsx.ec2.Vpc(prefixed('Vpc'), {
  enableDnsHostnames: true,
  enableDnsSupport: true,
});<% } %>
const lb = new LoadBalancerAlbPublic('LoadBalancer', { vpc });
<% if (includeStorage) { %>
const storage = new StorageS3;<% } %><% if (includeDb) { %>
const db = new PostgresRdsCluster('Database', {
  vpc,
});<% } %>
const cdn = new CdnCloudFront('CDN', {
  lb: lb.lb,<% if (includeStorage) { %>
  storage: storage.bucket,<% } %>
});<% if (networkType === 'private') { %>
const appSecurityGroup = new aws.ec2.SecurityGroup('AppSecurityGroup', {
  vpcId: vpc.vpcId,
  ingress: [{
    protocol: 'tcp',
    fromPort: <%= port !== 'unknown' ? port : 3000 %>,
    toPort: <%= port !== 'unknown' ? port : 3000 %>,
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
<% } %>

const app = new AppFargate('App', {
  vpc,
  loadBalancer: lb.lb,
  cdnHostname: cdn.distribution.domainName,<% if (networkType === 'private') { %>
  subnetIds: vpc.privateSubnetIds,<% } %><% if (includeDb) { %>
  connectionStringSecret: db.connectionStringSecret, <% } %><% if (includeStorage) { %>
  storage: storage.bucket,<% } %><% if (networkType === 'private') { %>
  securityGroups: [appSecurityGroup]<% }%><% if (port !== 'unknown') { %>
  taskDefinitionArgs: {
    container: {
      portMappings: [{ containerPort: <%= port %>, hostPort: <%= port %> }],
    },
  },<% } %>
});
<% if (networkType === 'private' && includeDb) { %>
const bastion = new BastionEc2('Bastion', { 
  vpc,
  securityGroups: [appSecurityGroup],
});<% } %>

export const vpcId = vpc.vpcId;
export const service = app.service.service.name;
export const cdnHostname = pulumi.interpolate`https://${cdn.distribution.domainName}`;<% if (includeStorage) { %>
export const objectStorageBucket = storage.bucket.bucket;<% } %><% if (includeDb) { %>
export const dbCluster = db.dbCluster.clusterIdentifier;
export const dbSecret = db.connectionStringSecret.arn;<% } %><% if (networkType === 'private' && includeDb) { %>
export const bastionInstanceId = bastion.instance.id;<% } %>
