
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export class StorageS3 extends pulumi.ComponentResource {
  mediaBucket: aws.s3.BucketV2;

  constructor(name: string = 'Storage', opts?: pulumi.ComponentResourceOptions) {
    super("limgen:StorageS3Component", name, {}, opts);
    const stack = pulumi.getStack();
    this.mediaBucket = new aws.s3.BucketV2("ObjectStorage", {
      bucketPrefix: pulumi.interpolate`blog-${stack}-media`,
    });
    this.registerOutputs({
      bucketName: this.mediaBucket.bucket,
    });
  }
}
