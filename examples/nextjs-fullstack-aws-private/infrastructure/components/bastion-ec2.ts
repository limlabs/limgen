import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { z } from "zod";
import { prefixed } from "../utils/prefixed";

const bastionEc2Args = z.object({
    ami: z.string().default("ami-055e3d4f0bbeb5878"),
    instanceType: z.string().default("t2.micro"),
    vpc: z.object({
        vpcId: z.union([z.string(), z.any()]),
        privateSubnetIds: z.union([z.array(z.string()), z.any()]),
    }),
    securityGroups: z.array(z.instanceof(aws.ec2.SecurityGroup)),
});

export type BastionEc2Args = z.infer<typeof bastionEc2Args>;

export class BastionEc2 extends pulumi.ComponentResource {
    _args: BastionEc2Args;
    instance: aws.ec2.Instance;
    constructor(name: string, args: BastionEc2Args, opts?: pulumi.ComponentResourceOptions) {
        super("custom:BastionEc2", name, {}, opts);
        this._args = bastionEc2Args.parse(args);
        const role = new aws.iam.Role(`${name}-role`, {
            assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: "ec2.amazonaws.com" }),
        });

        new aws.iam.RolePolicyAttachment(`${name}RolePolicyAttachment`, {
            role: role,
            policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
        });

        const instanceProfile = new aws.iam.InstanceProfile(`${name}-instance-profile`, { role: role });

        this.instance = new aws.ec2.Instance(name, {
            ami: this._args.ami,
            instanceType: this._args.instanceType,
            subnetId: this._args.vpc.privateSubnetIds[0],
            vpcSecurityGroupIds: this._args.securityGroups.map(sg => sg.id),
            iamInstanceProfile: instanceProfile.name,
            userData: `#!/bin/bash
            sudo yum install -y amazon-ssm-agent
            sudo systemctl enable amazon-ssm-agent
            sudo systemctl start amazon-ssm-agent`,
            tags: {
                Name: prefixed('bastion'),
            },
        }, { parent: this });
    }
}