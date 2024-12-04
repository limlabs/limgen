import * as pulumi from "@pulumi/pulumi";
import * as azureNative from "@pulumi/azure-native";
import * as docker from "@pulumi/docker";

// Create an Azure Resource Group
const resourceGroup = new azureNative.resources.ResourceGroup("resourceGroup", {
  location: "CentralUS",
});

// Create an Azure Container Registry
const registry = new azureNative.containerregistry.Registry("registry", {
  resourceGroupName: resourceGroup.name,
  sku: {
    name: "Basic",
  },
  adminUserEnabled: true,
});

// Get the admin credentials for the Azure Container Registry
const credentials = pulumi.all([registry.name, resourceGroup.name]).apply(([registryName, rgName]) =>
  azureNative.containerregistry.listRegistryCredentials({
    resourceGroupName: rgName,
    registryName: registryName,
  })
);

const adminUsername = credentials.apply(creds => creds.username!);
const adminPassword = credentials.apply(creds => creds.passwords![0].value!);

// Define the Next.js Docker image using Pulumi Docker resource
const appName = "nextjs-app";
const dockerImage = new docker.Image(appName, {
  build: {
    context: "../../..", // Path to your Dockerfile and app
    platform: "linux/amd64",
  },
  imageName: pulumi.interpolate`${registry.loginServer}/${appName}:v1.0.0`,
  registry: {
    server: registry.loginServer,
    username: adminUsername,
    password: adminPassword,
  },
});

// Create a Log Analytics Workspace
const logAnalyticsWorkspace = new azureNative.operationalinsights.Workspace("logAnalyticsWorkspace", {
  resourceGroupName: resourceGroup.name,
  location: resourceGroup.location,
  sku: {
    name: "PerGB2018",
  },
  retentionInDays: 30,
  workspaceCapping: {
    dailyQuotaGb: 1,
  },
});

// Get the shared key for the Log Analytics Workspace
const logAnalyticsSharedKey = pulumi.all([resourceGroup.name, logAnalyticsWorkspace.name]).apply(([rgName, workspaceName]) =>
  azureNative.operationalinsights.getSharedKeys({
    resourceGroupName: rgName,
    workspaceName: workspaceName,
  }).then(keys => keys.primarySharedKey)
);

// Create a Managed Environment for Azure Container Apps
const managedEnv = new azureNative.app.ManagedEnvironment("managedEnv", {
  resourceGroupName: resourceGroup.name,
  location: resourceGroup.location,
  appLogsConfiguration: {
    destination: "log-analytics",
    logAnalyticsConfiguration: {
      customerId: logAnalyticsWorkspace.customerId,
      sharedKey: logAnalyticsSharedKey,
    },
  },
});

// Create the Container App
const containerApp = new azureNative.app.ContainerApp(appName, {
  resourceGroupName: resourceGroup.name,
  managedEnvironmentId: managedEnv.id,
  configuration: {
    secrets: [
      {
        name: "admin-password",
        value: adminPassword,
      },
    ],
    ingress: {
      external: true,
      targetPort: 3000,
    },
    registries: [{
      server: registry.loginServer,
      passwordSecretRef: "admin-password",
      username: adminUsername,
    }],
  },
  template: {
    containers: [{
      name: appName,
      image: dockerImage.imageName,
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
});

// Export the FQDN of the container app
export const containerAppUrl = pulumi.interpolate`https://${containerApp.configuration.apply(config => config?.ingress?.fqdn)}`;
