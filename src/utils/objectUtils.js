// Helper function to check if an item is a non-array object
const isObject = (item) => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

/**
 * Deeply merges two objects. Properties in the source object overwrite properties
 * in the target object. If both properties are objects, they are merged recursively.
 *
 * @param {Object} target - The target object to merge into.
 * @param {Object} source - The source object to merge from.
 * @returns {Object} - The merged object.
 */
export const deepMerge = (target, source) => {
  // Create a new object to avoid modifying the original target
  let output = { ...target };

  // Ensure both target and source are objects
  if (isObject(target) && isObject(source)) {
    // Iterate over keys in the source object
    Object.keys(source).forEach(key => {
      // If the property in source is an object, merge recursively
      if (isObject(source[key])) {
        // If the key doesn't exist in target or target's property is not an object,
        // assign source's object directly
        if (!(key in target) || !isObject(target[key])) {
          output[key] = source[key];
        } else {
          // Otherwise, perform a recursive merge
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        // If the property is not an object, simply assign it (overwrite)
        output[key] = source[key];
      }
    });
  } else if (isObject(source)) {
      // If target is not an object but source is, return a clone of source
      // This handles cases where target might be null or undefined
      return { ...source };
  }
  // If source is not an object, the initial clone of target is returned
  
  return output;
};

// Example Usage:
// const obj1 = { a: 1, b: { c: 2, d: 3 } };
// const obj2 = { b: { c: 4, e: 5 }, f: 6 };
// const merged = deepMerge(obj1, obj2);
// console.log(merged); // Output: { a: 1, b: { c: 4, d: 3, e: 5 }, f: 6 }
