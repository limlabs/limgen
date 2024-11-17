
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { prefixed } from "@/utils/prefixed";

export class StorageS3 extends pulumi.ComponentResource {
  bucket: aws.s3.BucketV2;

  constructor(name: string = 'Storage', opts?: pulumi.ComponentResourceOptions) {
    super("limgen:StorageS3Component", name, {}, opts);
    this.bucket = new aws.s3.BucketV2("ObjectStorage", {
      bucketPrefix: prefixed("storage"),
    });

    this.registerOutputs({
      bucketName: this.bucket.bucket,
    });
  }
}
