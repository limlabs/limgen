import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { prefixed } from "../utils/prefixed";
import { deepMerge } from "../utils/deep-merge";

export interface LoadBalancerAlbPublicArgs {
  vpc: awsx.ec2.Vpc;
  albConfig?: awsx.lb.ApplicationLoadBalancerArgs;
}

export class LoadBalancerAlbPublic extends pulumi.ComponentResource {
  _args: LoadBalancerAlbPublicArgs;

  lb: awsx.lb.ApplicationLoadBalancer;

  constructor(name: string = 'LoadBalancer', args: LoadBalancerAlbPublicArgs, opts?: pulumi.ComponentResourceOptions) {
    super("limgen:LoadBalancerAlbPublic", name, {}, opts);
    this._args = args;

    this.lb = new awsx.lb.ApplicationLoadBalancer("LoadBalancer", deepMerge({
      name: prefixed("lb"),
      defaultSecurityGroup: {
        args: {
          name: prefixed("sg-lb"),
          vpcId: this._args.vpc.vpc.id,
          ingress: [
            {
              protocol: "tcp",
              fromPort: 80,
              toPort: 80,
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
        }
      },
      subnetIds: this._args.vpc.publicSubnetIds,
      defaultTargetGroup: {
        vpcId: this._args.vpc.vpcId,
        name: prefixed("tg"),
        port: 3000,
        targetType: "ip",
        deregistrationDelay: 10,
        healthCheck: {
          enabled: true,
        }
      },
      listener: {
        port: 80,
      },
    }, this._args.albConfig));

    this.registerOutputs({
    });
  }
}
