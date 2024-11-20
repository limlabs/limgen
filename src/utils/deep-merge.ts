function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deeply merges the properties of the source object into the target object.
 * If both target and source are objects, it recursively merges their properties.
 * If both target and source are arrays, it concatenates the source array into the target array.
 *
 * @param target - The target object or array to merge properties into.
 * @param source - The source object or array to merge properties from.
 * @returns The modified target object or array.
 */
export function deepMerge(target: any, source: any): any {
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} });
        }
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  } else if (Array.isArray(target) && Array.isArray(source)) {
    target.push(...source);
  }
  return target;
}

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};
