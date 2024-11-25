
import * as pulumi from "@pulumi/pulumi";

import { VpcPublic } from "../../components/vpc-public";
import { LoadBalancerAlbPublic } from "../../components/lb-alb-public";
import { AppFargate } from "../../components/app-fargate";
import { CdnCloudFront } from "../../components/cdn-cloudfront";

const { vpc } = new VpcPublic;
const lb = new LoadBalancerAlbPublic('LoadBalancer', { vpc });

const cdn = new CdnCloudFront('CDN', {
  lb: lb.lb,
});

const app = new AppFargate('App', {
  vpc,
  loadBalancer: lb.lb,
  cdnHostname: cdn.distribution.domainName,
  taskDefinitionArgs: {
    container: {
      portMappings: [{ containerPort: 9000, hostPort: 9000 }],
    },
  },
});


export const vpcId = vpc.vpcId;
export const service = app.service.service.name;
export const cdnHostname = pulumi.interpolate`https://${cdn.distribution.domainName}`;
