import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { prefixed } from "../utils/prefixed";
import { deepMerge } from "../utils/deep-merge";

export interface StorageS3Args {
  bucketArgs?: aws.s3.BucketV2Args;
}

export class StorageS3 extends pulumi.ComponentResource {
  bucket: aws.s3.BucketV2;

  constructor(name: string = 'Storage', args?: StorageS3Args, opts?: pulumi.ComponentResourceOptions) {
    super("limgen:StorageS3Component", name, {}, opts);
    this.bucket = new aws.s3.BucketV2("ObjectStorage", deepMerge({
      bucketPrefix: prefixed("storage"),
    }, args?.bucketArgs));

    this.registerOutputs({
      bucketName: this.bucket.bucket,
    });
  }
}
