
import * as pulumi from "@pulumi/pulumi";

import { VpcPublic } from "../../components/vpc-public";
import { LoadBalancerAlbPublic } from "../../components/lb-alb-public";
import { AppFargate } from "../../components/app-fargate";
import { CdnCloudFront } from "../../components/cdn-cloudfront";

const publicVpc = new VpcPublic;
const lb = new LoadBalancerAlbPublic('LoadBalancer', {
  vpc: publicVpc.vpc,
});

const cdn = new CdnCloudFront('CDN', {
  lb: lb.lb,
});

const app = new AppFargate('App', {
  vpc: publicVpc.vpc,
  loadBalancer: lb.lb,
  cdnHostname: cdn.distribution.domainName,
});

export const vpcId = publicVpc.vpc.vpcId;
export const publicSubnetIds = publicVpc.vpc.publicSubnetIds;
export const cluster = app.cluster.arn;
export const service = app.service.service.name;
export const cdnHostname = pulumi.interpolate`https://${cdn.distribution.domainName}`;
