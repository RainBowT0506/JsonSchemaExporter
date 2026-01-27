export type SchemaNode = {
    name: string;
    path: string;
    type: 'scalar' | 'array' | 'object';
    children?: SchemaNode[];
};

export type ArrayRule = 'join' | 'count' | 'first' | 'last' | 'json';

/**
 * Deeply merges objects for the purpose of schema inference.
 * Arrays are concatenated to ensure all possible structures are captured.
 */
function deepMergeForInference(obj1: any, obj2: any): any {
    if (obj1 === null || obj1 === undefined) return obj2;
    if (obj2 === null || obj2 === undefined) return obj1;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1;

    if (Array.isArray(obj1) || Array.isArray(obj2)) {
        const arr1 = Array.isArray(obj1) ? obj1 : [obj1];
        const arr2 = Array.isArray(obj2) ? obj2 : [obj2];
        return [...arr1, ...arr2];
    }

    const result = { ...obj1 };
    for (const key in obj2) {
        if (key in result) {
            result[key] = deepMergeForInference(result[key], obj2[key]);
        } else {
            result[key] = obj2[key];
        }
    }
    return result;
}

/**
 * Recursively scans an object to build a nested schema tree.
 */
export function buildSchemaTree(obj: any, parentPath = '', name = 'root'): SchemaNode {
    const type = Array.isArray(obj) ? 'array' : (obj && typeof obj === 'object') ? 'object' : 'scalar';

    let path = parentPath;
    if (name !== 'root') {
        path = parentPath ? `${parentPath}.${name}` : name;
    }

    const node: SchemaNode = { name, path, type };

    if (type === 'array') {
        const arrayPath = `${path}[]`;
        node.path = arrayPath;

        if (obj.length > 0) {
            // Deep merge all items into one representative object to infer children
            const combinedItem = obj.reduce((acc: any, item: any) => deepMergeForInference(acc, item), null);

            if (combinedItem && typeof combinedItem === 'object') {
                node.children = Object.entries(combinedItem).map(([key, value]) =>
                    buildSchemaTree(value, arrayPath, key)
                );
            }
        }
    } else if (type === 'object' && obj !== null) {
        node.children = Object.entries(obj).map(([key, value]) =>
            buildSchemaTree(value, name === 'root' ? '' : path, key)
        );
    }

    return node;
}

/**
 * Merges two schema trees into one.
 */
export function mergeSchemaTrees(base: SchemaNode, extra: SchemaNode): SchemaNode {
    const node: SchemaNode = { ...base };

    if (extra.type === 'object' || extra.type === 'array') {
        const baseChildren = base.children || [];
        const extraChildren = extra.children || [];
        const mergedChildren = [...baseChildren];

        extraChildren.forEach(extraChild => {
            const existingIdx = mergedChildren.findIndex(c => c.name === extraChild.name);
            if (existingIdx !== -1) {
                mergedChildren[existingIdx] = mergeSchemaTrees(mergedChildren[existingIdx], extraChild);
            } else {
                mergedChildren.push(extraChild);
            }
        });

        node.children = mergedChildren.length > 0 ? mergedChildren : undefined;
    }

    return node;
}

/**
 * Traverses the schema tree to find all leaf paths (scalars).
 */
export function getAllLeafPaths(node: SchemaNode): string[] {
    if (node.type === 'scalar') {
        return [node.path];
    }

    if (node.children) {
        return node.children.flatMap(child => getAllLeafPaths(child));
    }

    return [];
}

/**
 * Flattens a JSON object based on selected paths and aggregation rules.
 */
export function flattenTour(
    data: any,
    selectedPaths: string[],
    rule: ArrayRule = 'join',
    separator = '; '
): Record<string, any> {
    const result: Record<string, any> = {};

    selectedPaths.forEach(path => {
        const value = getValueByPath(data, path);

        if (path.includes('[]')) {
            if (!Array.isArray(value)) {
                result[path] = value ?? '';
                return;
            }

            const flatValues = value.flat(Infinity).filter(v => v !== null && v !== undefined);

            switch (rule) {
                case 'count':
                    result[path] = flatValues.length;
                    break;
                case 'first':
                    result[path] = flatValues[0] ?? '';
                    break;
                case 'last':
                    result[path] = flatValues[flatValues.length - 1] ?? '';
                    break;
                case 'json':
                    result[path] = JSON.stringify(flatValues);
                    break;
                case 'join':
                default:
                    result[path] = flatValues.join(separator);
                    break;
            }
        } else {
            result[path] = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : (value ?? '');
        }
    });

    return result;
}

/**
 * Helper to get value(s) from an object using dot-path notation.
 */
export function getValueByPath(obj: any, path: string): any {
    if (!obj) return undefined;

    const parts = path.split('.');
    let current: any = obj;

    for (let i = 0; i < parts.length; i++) {
        // Robustness: if current is not an object or null/undefined, we can't go deeper
        if (current === null || current === undefined || typeof current !== 'object') return undefined;

        const part = parts[i];

        if (part.endsWith('[]')) {
            const key = part.slice(0, -2);
            const array = key ? current[key] : current;

            if (!Array.isArray(array)) return undefined;

            const restPath = parts.slice(i + 1).join('.');
            if (!restPath) return array;

            return array.flatMap(item => {
                const val = getValueByPath(item, restPath);
                return val === undefined ? [] : [val];
            });
        }

        current = current[part];
    }

    return current;
}
