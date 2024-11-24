
import * as pulumi from "@pulumi/pulumi";

import { VpcPublic } from "../../components/vpc-public";
import { LoadBalancerAlbPublic } from "../../components/lb-alb-public";
import { AppFargate } from "../../components/app-fargate";
import { CdnCloudFront } from "../../components/cdn-cloudfront";
import { PostgresRdsCluster } from "../../components/db-postgres-rds";
import { StorageS3 } from "../../components/storage-s3";

const { vpc } = new VpcPublic;
const lb = new LoadBalancerAlbPublic('LoadBalancer', { vpc });

const storage = new StorageS3;
const db = new PostgresRdsCluster('Database', { vpc });
const cdn = new CdnCloudFront('CDN', {
  lb: lb.lb,
  storage: storage.bucket,
});

const app = new AppFargate('App', {
  vpc,
  loadBalancer: lb.lb,
  cdnHostname: cdn.distribution.domainName,
  connectionStringSecret: db.connectionStringSecret, 
  storage: storage.bucket,
});

export const vpcId = vpc.vpcId;
export const service = app.service.service.name;
export const cdnHostname = pulumi.interpolate`https://${cdn.distribution.domainName}`;
export const objectStorageBucket = storage.bucket.bucket;
export const dbCluster = db.dbCluster.clusterIdentifier;
export const dbSecret = db.connectionStringSecret.arn;
