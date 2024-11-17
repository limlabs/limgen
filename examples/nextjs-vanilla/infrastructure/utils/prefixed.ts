import * as pulumi from "@pulumi/pulumi";

export const prefixed = (name: string) => {
  return `${pulumi.getProject()}-${pulumi.getStack()}-${name}`;
}
