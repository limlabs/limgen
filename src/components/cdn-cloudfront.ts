
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";
import * as awsx from "@pulumi/awsx";

export interface CdnCloudFrontArgs {
  lb: awsx.lb.ApplicationLoadBalancer,
  objectStorage?: aws.s3.BucketV2,
  cloudFrontDistributionArgs?: aws.cloudfront.DistributionArgs
}

export class CdnCloudFront extends pulumi.ComponentResource {
  _args: CdnCloudFrontArgs;
  _stack: string;

  distribution: aws.cloudfront.Distribution;
  originAccessIdentity: aws.cloudfront.OriginAccessIdentity;
  originBucketPolicy: aws.s3.BucketPolicy | null = null;

  constructor(name: string = 'CDN', args: CdnCloudFrontArgs, opts?: pulumi.ComponentResourceOptions) {
    super("limgen:CloudFrontComponent", name, {}, opts);
    this._stack = pulumi.getStack();
    this._args = args;

    this.originAccessIdentity = this.getOriginAccessIdentity();

    if (this._args.objectStorage) {
      this.originBucketPolicy = this.getOriginBucketPolicy();
    }

    this.distribution = this.getDistribution();

    this.registerOutputs({});
  }
  getDistribution(): aws.cloudfront.Distribution {
    let orderedCacheBehaviors = [];
    const origins: aws.types.input.cloudfront.DistributionOrigin[] = [
      {
        domainName: this._args.lb.loadBalancer.dnsName,
        originId: `blog-${this._stack}-origin`,
        customOriginConfig: {
          originProtocolPolicy: "http-only",
          httpPort: 80,
          httpsPort: 443,
          originSslProtocols: ["TLSv1.2"],
        },
      },
    ]

    if (this._args.objectStorage) {
      origins.push({
        domainName: this._args.objectStorage.bucketRegionalDomainName,
        originId: `blog-${this._stack}-media-origin`,
        s3OriginConfig: {
          originAccessIdentity: this.originAccessIdentity.cloudfrontAccessIdentityPath,
        },
      });

      orderedCacheBehaviors.push({
        pathPattern: "/media/*",
        targetOriginId: `blog-${this._stack}-media-origin`,
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
    }

    return new aws.cloudfront.Distribution(`blog-${this._stack}-distribution`, {
      enabled: true,
      origins,
      orderedCacheBehaviors,
      defaultCacheBehavior: {
        targetOriginId: `blog-${this._stack}-origin`,
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
      },
      priceClass: "PriceClass_100",
      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },
      restrictions: {
        geoRestriction: {
          restrictionType: "none",
        },
      },
      ...this._args.cloudFrontDistributionArgs
    });
  }
  getOriginBucketPolicy(): aws.s3.BucketPolicy {
    if (!this._args.objectStorage) {
      throw new Error("Media bucket is required to create an origin bucket policy");
    }

    return new aws.s3.BucketPolicy("OriginBucketPolicy", {
      bucket: this._args.objectStorage.id,
      policy: pulumi.all([
        this._args.objectStorage.arn,
        this.originAccessIdentity.iamArn
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
    return new aws.cloudfront.OriginAccessIdentity(`blog-${this._stack}-oai`, {
      comment: "OAI for CloudFront distribution to access S3 bucket",
    });
  }
}