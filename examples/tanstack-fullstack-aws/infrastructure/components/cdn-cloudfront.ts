
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { prefixed } from "../utils/prefixed";
import { deepMerge } from "../utils/deep-merge";

export interface CdnCloudFrontArgs {
  lb?: awsx.lb.ApplicationLoadBalancer,
  storage?: aws.s3.BucketV2,
  storagePathPattern?: string,
  cloudFrontDistributionArgs?: aws.cloudfront.DistributionArgs
}

export class CdnCloudFront extends pulumi.ComponentResource {
  _args: CdnCloudFrontArgs;

  distribution: aws.cloudfront.Distribution;
  originAccessIdentity: aws.cloudfront.OriginAccessIdentity | null = null;
  originBucketPolicy: aws.s3.BucketPolicy | null = null;

  constructor(name: string = 'CDN', args: CdnCloudFrontArgs, opts?: pulumi.ComponentResourceOptions) {
    super("limgen:CloudFrontComponent", name, {}, opts);
    this._args = args;
    
    if (this._args.storage) {
      this.originAccessIdentity = this.getOriginAccessIdentity();
      this.originBucketPolicy = this.getOriginBucketPolicy();
    }

    this.distribution = this.getDistribution();

    this.registerOutputs({});
  }
  getDistribution(): aws.cloudfront.Distribution {
    let orderedCacheBehaviors = [];
    const origins: aws.types.input.cloudfront.DistributionOrigin[] = []

    if (!this._args.lb && !this._args.storage) {
      throw new Error("At least one of lb or storage is required to create a CloudFront distribution");
    }

    let defaultCacheBehavior;

    if (this._args.lb) {
      origins.push({
        domainName: this._args.lb.loadBalancer.dnsName,
        originId: prefixed("lb-origin"),
        customOriginConfig: {
          originProtocolPolicy: "http-only",
          httpPort: 80,
          httpsPort: 443,
          originSslProtocols: ["TLSv1.2"],
        },
      });

      defaultCacheBehavior = {
        targetOriginId: prefixed("lb-origin"),
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"],
        cachedMethods: ["GET", "HEAD"],
        compress: true,
        forwardedValues: {
          queryString: true,
          headers: ["*"],
          cookies: {
            forward: "all"
          }
        },
      }
    }

    if (this._args.storage) {
      origins.push({
        domainName: this._args.storage.bucketRegionalDomainName,
        originId: prefixed("storage-origin"),
        s3OriginConfig: {
          originAccessIdentity: this.originAccessIdentity!.cloudfrontAccessIdentityPath,
        },
      });

      orderedCacheBehaviors.push({
        pathPattern: this._args.storagePathPattern || "/media/*",
        targetOriginId: prefixed("storage-origin"),
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD"],
        compress: true,
        viewerProtocolPolicy: "redirect-to-https",
        forwardedValues: {
          headers: [],
          queryStringCacheKeys: [],
          queryString: false,
          cookies: {
            forward: "none"
          },
        },
      });

      if (!defaultCacheBehavior) {
        defaultCacheBehavior = {
          targetOriginId: prefixed("storage-origin"),
          viewerProtocolPolicy: "redirect-to-https",
          allowedMethods: ["GET", "HEAD", "OPTIONS"],
          cachedMethods: ["GET", "HEAD"],
          forwardedValues: {
            headers: [],
            queryStringCacheKeys: [],
            queryString: false,
            cookies: {
              forward: "none"
            },
          },
        }
      }
    }

    return new aws.cloudfront.Distribution("CloudFrontDistribution", deepMerge({
      enabled: true,
      origins,
      orderedCacheBehaviors,
      defaultCacheBehavior,
      priceClass: "PriceClass_100",
      defaultRootObject: "index.html",
      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },
      restrictions: {
        geoRestriction: {
          restrictionType: "none",
        },
      },
    }, this._args.cloudFrontDistributionArgs));
  }
  getOriginBucketPolicy(): aws.s3.BucketPolicy {
    if (!this._args.storage) {
      throw new Error("Media bucket is required to create an origin bucket policy");
    }

    return new aws.s3.BucketPolicy("OriginBucketPolicy", {
      bucket: this._args.storage.id,
      policy: pulumi.all([
        this._args.storage.arn,
        this.originAccessIdentity!.iamArn
      ]).apply(([storageArn, iamArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              AWS: iamArn,
            },
            Action: ["s3:GetObject"],
            Resource: `${storageArn}/*`,
          },
        ],
      })),
    });
  }
  getOriginAccessIdentity(): aws.cloudfront.OriginAccessIdentity {
    return new aws.cloudfront.OriginAccessIdentity("OriginAccessIdentity", {
      comment: "OAI for CloudFront distribution to access S3 bucket",
    });
  }
}