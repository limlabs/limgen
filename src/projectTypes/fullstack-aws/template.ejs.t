
import * as pulumi from "@pulumi/pulumi";

import { VpcPublic } from "../../components/vpc-public";
import { LoadBalancerAlbPublic } from "../../components/lb-alb-public";
import { AppFargate } from "../../components/app-fargate";
import { CdnCloudFront } from "../../components/cdn-cloudfront";<% if (includeDb) { %>
import { PostgresRdsCluster } from "../../components/db-postgres-rds";<% } %><% if (includeStorage) { %>
import { StorageS3 } from "../../components/storage-s3";<% } %>

const publicVpc = new VpcPublic;
const lb = new LoadBalancerAlbPublic('LoadBalancer', {
  vpc: publicVpc.vpc,
});
<% if (includeStorage) { %>
const storage = new StorageS3;<% } %><% if (includeDb) { %>
const db = new PostgresRdsCluster('Database', { vpc: publicVpc.vpc });<% } %>
const cdn = new CdnCloudFront('CDN', {
  lb: lb.lb,<% if (includeStorage) { %>
  storage: storage.bucket,<% } %>
});

const app = new AppFargate('App', {
  vpc: publicVpc.vpc,
  loadBalancer: lb.lb,
  cdnHostname: cdn.distribution.domainName,<% if (includeDb) { %>
  connectionStringSecret: db.connectionStringSecret, <% } %><% if (includeStorage) { %>
  storage: storage.bucket,<% } %><% if (port !== 'unknown') { %>
  taskDefinitionArgs: {
    container: {
      portMappings: [{ containerPort: <%= port %>, hostPort: <%= port %> }],
    },
  },<% } %>
});

export const vpcId = publicVpc.vpc.vpcId;
export const publicSubnetIds = publicVpc.vpc.publicSubnetIds;
export const cluster = app.cluster.arn;
export const service = app.service.service.name;
export const cdnHostname = pulumi.interpolate`https://${cdn.distribution.domainName}`;<% if (includeStorage) { %>
export const objectStorageBucket = storage.bucket.bucket;<% } %><% if (includeDb) { %>
export const dbCluster = db.dbCluster.clusterIdentifier;
export const dbSecret = db.connectionStringSecret.arn;<% } %>
