export type SchemaNode = {
    path: string;
    type: 'scalar' | 'array' | 'object';
    children?: Record<string, SchemaNode>;
    isNullable?: boolean;
};

/**
 * Recursively scans an object to build a schema map of dot-paths.
 */
export function buildSchema(obj: any, parentPath = '', schema: Record<string, SchemaNode> = {}): Record<string, SchemaNode> {
    if (obj === null || obj === undefined) return schema;

    if (Array.isArray(obj)) {
        const arrayPath = parentPath ? `${parentPath}[]` : '[]';
        if (!schema[arrayPath]) {
            schema[arrayPath] = { path: arrayPath, type: 'array' };
        }
        // Scan items in array to find all possible fields
        obj.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                buildSchema(item, arrayPath, schema);
            }
        });
        return schema;
    }

    if (typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
            const currentPath = parentPath ? `${parentPath}.${key}` : key;

            if (Array.isArray(value)) {
                const arrayPath = `${currentPath}[]`;
                if (!schema[arrayPath]) {
                    schema[arrayPath] = { path: arrayPath, type: 'array' };
                }
                value.forEach(item => {
                    if (typeof item === 'object' && item !== null) {
                        buildSchema(item, arrayPath, schema);
                    }
                });
            } else if (typeof value === 'object' && value !== null) {
                // We don't necessarily need to track "object" as a selectable field if it's just a container
                // but for nested paths like MarketingContent.TourID, we need to recurse.
                buildSchema(value, currentPath, schema);
            } else {
                if (!schema[currentPath]) {
                    schema[currentPath] = { path: currentPath, type: 'scalar' };
                }
            }
        });
    }

    return schema;
}

/**
 * Flattens a JSON object into a single-level object based on selected dot-paths.
 * Handles array joining for "Tour-level" export.
 */
export function flattenTour(data: any, selectedPaths: string[], arraySeparator = '; '): Record<string, any> {
    const result: Record<string, any> = {};

    selectedPaths.forEach(path => {
        const value = getValueByPath(data, path);

        if (path.includes('[]')) {
            // It's an array path. getValueByPath will return an array of values for such paths.
            if (Array.isArray(value)) {
                // Flatten nested arrays if any (e.g. DailyList[].AttractionsList[].Name)
                const flatValues = value.flat(Infinity).filter(v => v !== null && v !== undefined);
                result[path] = flatValues.join(arraySeparator);
            } else {
                result[path] = value ?? '';
            }
        } else {
            result[path] = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : (value ?? '');
        }
    });

    return result;
}

/**
 * Helper to get value(s) from an object using dot-path notation with array support.
 */
export function getValueByPath(obj: any, path: string): any {
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

            // Recurse into array elements
            return array.map(item => getValueByPath(item, restPath));
        }

        if (current === null || current === undefined) return undefined;
        current = current[part];
    }

    return current;
}
