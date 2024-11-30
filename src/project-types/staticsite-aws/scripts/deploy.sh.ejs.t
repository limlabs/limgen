set -e

# get project name from first argument, or use

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
bucketName=$(echo $pulumiOutput | jq -r '.bucketName')

aws s3 sync ../../../<%=outputDir %>/ s3://$bucketName
)
