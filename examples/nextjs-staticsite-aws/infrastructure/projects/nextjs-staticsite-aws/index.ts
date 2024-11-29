import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { StorageS3 } from "../../components/storage-s3";

import { CdnCloudFront } from "../../components/cdn-cloudfront";

const storage = new StorageS3();

new aws.s3.BucketWebsiteConfigurationV2('Website', {
  bucket: storage.bucket.bucket,
  indexDocument: { suffix: 'index.html' },
  errorDocument: { key: 'error.html' },
});

const cdn = new CdnCloudFront('CDN', {
  storage: storage.bucket,
  storagePathPattern: '/*',
});

export const bucketName = storage.bucket.bucket;
export const websiteUrl = pulumi.interpolate`https://${cdn.distribution.domainName}`;