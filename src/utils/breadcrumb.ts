import { getValueByPath } from './schema';

export interface BreadcrumbOption {
    code: string;
    name: string;
    children: Map<string, BreadcrumbOption>;
}

export type BreadcrumbTree = Map<string, BreadcrumbOption>;

/**
 * Builds a hierarchical tree from the data found at the specified source path.
 * Assumes the data at 'sourcePath' is an array of objects with { code, name } structure,
 * representing a path from root to leaf.
 */
export function buildBreadcrumbTree(files: any[], sourcePath: string): BreadcrumbTree {
    const tree: BreadcrumbTree = new Map();

    files.forEach(file => {
        let content = file.content;
        if (!content && file.file) return; // Should be parsed content

        // Support for "queries.getCommBreadcrumb" style paths
        // But usually content is the root. 
        // We will leniently look for the array.

        let targetData: any = null;

        // Specialized handling for the known structure: queries.getCommBreadcrumb[].data
        if (sourcePath.includes('getCommBreadcrumb')) {
            const breadcrumbs = content?.queries?.getCommBreadcrumb;
            if (Array.isArray(breadcrumbs)) {
                breadcrumbs.forEach((b: any) => {
                    if (Array.isArray(b.data)) {
                        addToTree(tree, b.data);
                    }
                });
            }
            return;
        }

        // Generic handling (fallback)
        targetData = getValueByPath(content, sourcePath);
        if (Array.isArray(targetData)) {
            addToTree(tree, targetData);
        }
    });

    return tree;
}

function addToTree(tree: BreadcrumbTree, pathChain: any[]) {
    let currentLevel = tree;

    pathChain.forEach((node) => {
        if (!node || !node.code) return;

        const code = String(node.code);
        const name = node.name || code;

        if (!currentLevel.has(code)) {
            currentLevel.set(code, { code, name, children: new Map() });
        }

        currentLevel = currentLevel.get(code)!.children;
    });
}

/**
 * Checks if a file content matches the selected breadcrumb path.
 * path is an array of selected codes [L1_code, L2_code, ...]
 */
export function matchBreadcrumb(content: any, sourcePath: string, selectedCodes: string[]): boolean {
    if (selectedCodes.length === 0 || selectedCodes.every(c => !c)) return true;

    // Specialized handling
    if (sourcePath.includes('getCommBreadcrumb')) {
        const breadcrumbs = content?.queries?.getCommBreadcrumb;
        if (!Array.isArray(breadcrumbs)) return false;

        return breadcrumbs.some((b: any) => {
            const data = b?.data;
            if (!Array.isArray(data)) return false;
            return checkMatch(data, selectedCodes);
        });
    }

    // Generic handling
    const targetData = getValueByPath(content, sourcePath);
    if (Array.isArray(targetData)) {
        return checkMatch(targetData, selectedCodes);
    }

    return false;
}

function checkMatch(dataChain: any[], selectedCodes: string[]): boolean {
    // We match as far as selectedCodes goes.
    // If selectedCodes has 3 items, dataChain must match those 3.
    // dataChain might be longer (more specific), that's fine.

    for (let i = 0; i < selectedCodes.length; i++) {
        const codeToMatch = selectedCodes[i];
        if (!codeToMatch) continue; // Skip empty selections (if we allow gaps, though usually we don't)

        const node = dataChain[i];
        // If data doesn't have this level, no match
        if (!node) return false;

        if (String(node.code) !== codeToMatch) return false;
    }
    return true;
}
