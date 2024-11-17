
import * as pulumi from "@pulumi/pulumi";

import { VpcPublic } from "./components/vpc-public";
import { LoadBalancerAlbPublic } from "./components/lb-alb-public";
import { AppFargate } from "./components/app-fargate";
import { CdnCloudFront } from "./components/cdn-cloudfront";<% if (includeDb) { %>
import { PostgresRdsCluster } from "./components/db-postgres-rds";<% } %><% if (includeStorage) { %>
import { StorageS3 } from "./components/storage-s3";<% } %>

const publicVpc = new VpcPublic;
const lb = new LoadBalancerAlbPublic('LoadBalancer', {
  vpc: publicVpc.vpc,
});
<% if (includeStorage) { %>
const storage = new StorageS3;
<% } %><% if (includeDb) { %>
const db = new PostgresRdsClusterComponent('Database', { vpc: publicVpc }); 
<% } %>
const cdn = new CdnCloudFront('CDN', {
  lb: lb.lb,<% if (includeStorage) { %>
  mediaBucket: storage.mediaBucket,<% } %>
});

const app = new AppFargate('App', {
  vpc: publicVpc.vpc,
  loadBalancer: lb.lb,
  cdnHostname: cdn.distribution.domainName,<% if (includeDb) { %>
  dbCluster: db.dbCluster,
  connectionStringSecret: db.connectionStringSecret, <% } %><% if (includeStorage) { %>
  mediaBucket: storage.mediaBucket,<% } %>
});

export const vpcId = publicVpc.vpc.vpcId;
export const publicSubnetIds = publicVpc.vpc.publicSubnetIds;
export const cluster = app.cluster.arn;
export const service = app.service.service.name;
export const loadBalancerOrigin = pulumi.interpolate`http://${lb.lb.loadBalancer.dnsName}`;
export const cdnHostname = pulumi.interpolate`https://${cdn.distribution.domainName}`;
<% if (includeStorage) { %>
export const mediaBucket = storage.mediaBucket.bucket;
<% } %>
<% if (includeDb) { %>
export const dbCluster = db.dbCluster.clusterIdentifier;
export const dbSecret = db.dbCluster.secret.secretName;
<% } %>