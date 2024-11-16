import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

export interface LoadBalancerAlbPublicArgs {
  vpc: awsx.ec2.Vpc;
}

export class LoadBalancerAlbPublic extends pulumi.ComponentResource {
  _args: LoadBalancerAlbPublicArgs;
  _stack: string;

  lb: awsx.lb.ApplicationLoadBalancer;

  constructor(name: string = 'LoadBalancer', args: LoadBalancerAlbPublicArgs, opts?: pulumi.ComponentResourceOptions) {
    super("limgen:LoadBalancerAlbPublic", name, {}, opts);
    this._args = args;
    this._stack = pulumi.getStack();

    this.lb = new awsx.lb.ApplicationLoadBalancer("lb", {
      name: pulumi.interpolate`blog-${this._stack}-lb`,
      defaultSecurityGroup: {
        args: {
          name: pulumi.interpolate`blog-${this._stack}-public-ingress-sg-lb`,
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
        name: pulumi.interpolate`blog-${this._stack}-tg`,
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
    });

    this.registerOutputs({
    });
  }
}
