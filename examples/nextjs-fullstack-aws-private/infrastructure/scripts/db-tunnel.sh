#!/bin/bash

# Check if jq is installed
if ! command -v jq &> /dev/null
then
  echo "jq could not be found, please install it to proceed."
  exit
fi

# get the project from the first argument, default to working directorn basename
projectName=${1:-$(basename $(pwd))}

# get the stack from the second argument, or invoke 'pulumi stack select' to get it
stackName=$2


(
set -e
cd "infrastructure/projects/$projectName"

pulumi stack select $stackName

# Load Pulumi output
pulumiOutput=$(pulumi stack output --json)

# Extract necessary values from Pulumi output
bastionInstanceId=$(echo $pulumiOutput | jq -r '.bastionInstanceId')
dbEndpoint=$(echo $pulumiOutput | jq -r '.dbEndpoint')
dbPort=5432

# Create SSH tunnel using AWS SSM
echo "Creating tunnel to database using AWS SSM..."
aws ssm start-session \
  --target $bastionInstanceId \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "{\"host\":[\"${dbEndpoint}\"],\"portNumber\":[\"${dbPort}\"],\"localPortNumber\":[\"${dbPort}\"]}"
)