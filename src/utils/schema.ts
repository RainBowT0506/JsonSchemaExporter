export type SchemaNode = {
    name: string;
    path: string;
    type: 'scalar' | 'array' | 'object';
    children?: SchemaNode[];
};

export type ArrayRule = 'join' | 'count' | 'first' | 'last' | 'json';

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
            // Instead of a simple object merge, we build a schema for each item and merge them
            // this ensures we don't lose nested structure if some items have empty arrays/objects
            let mergedItemTree: SchemaNode | null = null;
            for (const item of obj) {
                const itemTree = buildSchemaTree(item, arrayPath, 'item');
                if (!mergedItemTree) {
                    mergedItemTree = itemTree;
                } else {
                    mergedItemTree = mergeSchemaTrees(mergedItemTree, itemTree);
                }
            }

            if (mergedItemTree && mergedItemTree.children) {
                node.children = mergedItemTree.children;
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

        if (current === null || current === undefined || typeof current !== 'object') return undefined;
        current = current[part];
    }

    return current;
}
