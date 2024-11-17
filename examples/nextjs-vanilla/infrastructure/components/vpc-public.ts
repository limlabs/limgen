
import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";
import { prefixed } from "@/utils/prefixed";

export class VpcPublic extends pulumi.ComponentResource {
  vpc: awsx.ec2.Vpc;

  constructor(name: string = 'VPC', opts?: pulumi.ComponentResourceOptions) {
    super("limgen:VpcComponent", name, {}, opts);
    this.vpc = new awsx.ec2.Vpc(prefixed('VPC'), {
      enableDnsHostnames: true,
      enableDnsSupport: true,
      cidrBlock: "10.0.0.0/16",
      natGateways: {
        strategy: "None",
      },
      subnetStrategy: "Auto",
      subnetSpecs: [
        {
          type: "Public",
          cidrMask: 20,
        },
      ],
    });
    this.registerOutputs({
      vpcId: this.vpc.vpc.id,
      publicSubnetIds: this.vpc.publicSubnetIds
    });
  }
}
