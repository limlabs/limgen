import * as pulumi from "@pulumi/pulumi";
import * as azureNative from "@pulumi/azure-native";
import * as docker from "@pulumi/docker";
import * as docker_build from "@pulumi/docker-build";
import { deepMerge } from "../utils/deep-merge";
import { prefixed } from "../utils/prefixed";

interface FullstackServiceAzureArgs {
    resourceGroup?: azureNative.resources.ResourceGroup;
    image?: docker_build.Image;
    registry?: azureNative.containerregistry.Registry;
    managedEnv?: azureNative.app.ManagedEnvironment;
    logAnalyticsWorkspace?: azureNative.operationalinsights.Workspace;
    managedEnvOptions?: azureNative.app.ManagedEnvironmentArgs;
    containerAppOptions?: azureNative.app.ContainerAppArgs;
    registryOptions?: azureNative.containerregistry.RegistryArgs;
    imageOptions?: docker.ImageArgs;
    resourceGroupOptions?: azureNative.resources.ResourceGroupArgs;
}

export class AppAzureAcs extends pulumi.ComponentResource {
    _args: FullstackServiceAzureArgs;

    resourceGroup: azureNative.resources.ResourceGroup;
    logAnalyticsWorkspace: azureNative.operationalinsights.Workspace;
    managedEnv: azureNative.app.ManagedEnvironment;
    registry: azureNative.containerregistry.Registry;
    image: docker_build.Image;
    app: azureNative.app.ContainerApp;
    containerAppUrl: pulumi.Output<string>;

    constructor(name: string = "App", args: FullstackServiceAzureArgs = {}, opts?: pulumi.ComponentResourceOptions) {
        super("custom:app:AppAzureAcs", name, {}, opts);
        this._args = args;

        this.resourceGroup = this._args.resourceGroup || new azureNative.resources.ResourceGroup(`ResourceGroup`, deepMerge({
            resourceGroupName: prefixed("rg"),
            location: "CentralUS",
        }, this._args.resourceGroupOptions));

        // Create the registry if not provided
        this.registry = this._args.registry || new azureNative.containerregistry.Registry(`Registry`, deepMerge({
            resourceGroupName: this.resourceGroup.name,
            name: prefixed("acr"),
            sku: {
                name: "Basic",
            },
            adminUserEnabled: true,
        }, this._args.containerAppOptions));

        this.logAnalyticsWorkspace = this._args.logAnalyticsWorkspace || new azureNative.operationalinsights.Workspace(`LogAnalyticsWorkspace`, {
            resourceGroupName: this.resourceGroup.name,
            workspaceName: prefixed("law"),
            sku: {
                name: "PerGB2018",
            },
            retentionInDays: 30,
        });
        const imageTag = pulumi.interpolate`${this.registry.loginServer}/${pulumi.getProject()}:latest`

        const imageArgs = {
            tags: [imageTag],
            context: {
                location: '../../..'
            },
            cacheFrom: [{
                registry: {
                    ref: imageTag,
                },
            }],
            cacheTo: [{
                inline: {},
            }],
            push: true,
            platforms: ["linux/amd64"],
            registries: [{
                address: this.registry.loginServer,
            }],
        };

        // Get the admin credentials for the Azure Container Registry
        const credentials = pulumi.all([this.registry.name, this.resourceGroup.name]).apply(([registryName, rgName]) =>
            azureNative.containerregistry.listRegistryCredentials({
                resourceGroupName: rgName,
                registryName: registryName,
            })
        );

        let adminUsername: pulumi.Output<string>;
        let adminPassword: pulumi.Output<string>;
        if (this.registry.adminUserEnabled) {
            adminUsername = credentials.apply(creds => creds.username!);
            adminPassword = credentials.apply(creds => creds.passwords![0].value!);

            (imageArgs.registries[0]! as any).username = adminUsername;
            (imageArgs.registries[0]! as any).password = adminPassword;
        }

        this.image = this._args.image || new docker_build.Image(`Image`, deepMerge(imageArgs, this._args.imageOptions));

        // Get the shared key for the Log Analytics Workspace
        const logAnalyticsSharedKey = pulumi.all([this.resourceGroup.name, this.logAnalyticsWorkspace.name]).apply(([rgName, workspaceName]) =>
            azureNative.operationalinsights.getSharedKeys({
                resourceGroupName: rgName,
                workspaceName: workspaceName,
            }).then(keys => keys.primarySharedKey)
        ) as pulumi.Output<string>;


        // Create a Managed Environment for Azure Container Apps
        this.managedEnv = this._args.managedEnv || new azureNative.app.ManagedEnvironment("managedEnv", deepMerge({
            resourceGroupName: this.resourceGroup.name,
            location: this.resourceGroup.location,
            appLogsConfiguration: {
                destination: "log-analytics",
                logAnalyticsConfiguration: {
                    customerId: this.logAnalyticsWorkspace.customerId,
                    sharedKey: logAnalyticsSharedKey,
                },
            },
        }, this._args.managedEnvOptions));

        const containerAppArgs = {
            dependsOn: [this.image],
            name: prefixed("app", 32),
            resourceGroupName: this.resourceGroup.name,
            managedEnvironmentId: this.managedEnv.id,
            configuration: {
                ingress: {
                    external: true,
                    targetPort: 3000,
                },
            },
            template: {
                containers: [{
                    name: pulumi.getProject(),
                    image: imageTag,
                    resources: {
                        cpu: 0.5,
                        memory: "1Gi",
                    },
                }],
                scale: {
                    minReplicas: 1,
                    maxReplicas: 5,
                },
            },
        }

        if (this.registry.adminUserEnabled) {
            (containerAppArgs.configuration as any).registries = [{
                server: this.registry.loginServer,
                username: adminUsername!,
                passwordSecretRef: "admin-password",
            }];

            (containerAppArgs.configuration as any).secrets = [{
                name: "admin-password",
                value: adminPassword!,
            }];
        }

        this.app = new azureNative.app.ContainerApp(prefixed('app', 24), deepMerge(containerAppArgs, this._args.containerAppOptions));

        this.containerAppUrl = pulumi.interpolate`https://${this.app.configuration.apply(config => config?.ingress?.fqdn)}`;
        this.registerOutputs({});
    }
}