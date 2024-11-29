import * as pulumi from "@pulumi/pulumi";

export const prefixed = (name: string, maxLength: number = -1) => {
  // if the prefix plus name plus hash extends beyond max length, shorten and add the hash
  const prefix = `${pulumi.getProject()}-${pulumi.getStack()}-`;
  if (maxLength > 0 && prefix.length + name.length > maxLength) {
    const hash = require("crypto")
      .createHash("md5")
      .update(prefix + name)
      .digest("hex")
      .substring(0, 6);
    const availableLength = maxLength - hash.length;
    const truncatedName = (prefix + name).substring(0, availableLength);
    return `${truncatedName}${hash}`;
  }

  return `${prefix}${name}`;
}
