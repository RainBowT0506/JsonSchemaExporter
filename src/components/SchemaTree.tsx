import React, { useState } from 'react';
import type { SchemaNode } from '../utils/schema';
import { ChevronRight, ChevronDown, Square, CheckSquare, Search, Box, Layers, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SchemaTreeProps {
    tree: SchemaNode;
    selectedPaths: string[];
    onTogglePath: (path: string, included: boolean) => void;
    onToggleBatch: (paths: string[], included: boolean) => void;
}

export const SchemaTree: React.FC<SchemaTreeProps> = ({
    tree,
    selectedPaths,
    onTogglePath,
    onToggleBatch
}) => {
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'root': true });

    const toggleExpand = (path: string) => {
        setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
    };

    const getAllChildrenPaths = (node: SchemaNode): string[] => {
        let paths: string[] = [];
        if (node.name !== 'root') paths.push(node.path);
        if (node.children) {
            node.children.forEach(child => {
                paths = [...paths, ...getAllChildrenPaths(child)];
            });
        }
        return paths;
    };

    const renderNode = (node: SchemaNode, level = 0) => {
        const isRoot = node.name === 'root';
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expanded[node.path] || false;
        const isSelected = selectedPaths.includes(node.path);

        // Check if some children are selected (for indeterminate look, though we use simple checkboxes here)
        const childrenPaths = getAllChildrenPaths(node);
        const allChildrenSelected = childrenPaths.length > 0 && childrenPaths.every(p => selectedPaths.includes(p));

        if (search && !node.path.toLowerCase().includes(search.toLowerCase()) && !childrenPaths.some(p => p.toLowerCase().includes(search.toLowerCase()))) {
            return null;
        }

        return (
            <div key={node.path} style={{ marginLeft: level > 0 ? '12px' : 0 }}>
                {!isRoot && (
                    <div
                        className="tree-item"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                            fontSize: '0.9rem'
                        }}
                    >
                        <div onClick={() => toggleExpand(node.path)} style={{ width: '24px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                            {hasChildren ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : null}
                        </div>

                        <div
                            onClick={() => {
                                if (hasChildren) {
                                    onToggleBatch(childrenPaths, !allChildrenSelected);
                                } else {
                                    onTogglePath(node.path, !isSelected);
                                }
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}
                        >
                            <div style={{ color: (isSelected || allChildrenSelected) ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                                {(isSelected || allChildrenSelected) ? <CheckSquare size={18} /> : <Square size={18} />}
                            </div>
                            <span style={{
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {node.name}
                            </span>
                            {node.type === 'array' && <Layers size={12} style={{ color: 'var(--warning-color)', flexShrink: 0 }} />}
                            {node.type === 'object' && <Box size={12} style={{ color: 'var(--accent-color)', opacity: 0.6, flexShrink: 0 }} />}
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {(isExpanded || isRoot) && hasChildren && (
                        <motion.div
                            initial={isRoot ? { opacity: 1 } : { height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            {node.children!.map(child => renderNode(child, isRoot ? 0 : level + 1))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="schema-explorer glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={16} /> Schema Explorer
                </h3>
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search fields..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 8px 8px 32px',
                            background: 'var(--surface-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '0.85rem'
                        }}
                    />
                </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {renderNode(tree)}
            </div>
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {selectedPaths.length} fields selected
            </div>
        </div>
    );
};
