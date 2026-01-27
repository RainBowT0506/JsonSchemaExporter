import React, { useState, useMemo } from 'react';
import type { SchemaNode } from '../utils/schema';
import { Search, CheckSquare, Square, Box, Layers, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface FieldSelectorProps {
    schema: Record<string, SchemaNode>;
    selectedPaths: string[];
    onPathsChange: (paths: string[]) => void;
}

export const FieldSelector: React.FC<FieldSelectorProps> = ({
    schema,
    selectedPaths,
    onPathsChange
}) => {
    const [search, setSearch] = useState('');

    const filteredPaths = useMemo(() => {
        return Object.keys(schema).filter(path =>
            path.toLowerCase().includes(search.toLowerCase())
        ).sort();
    }, [schema, search]);

    const handleToggle = (path: string) => {
        if (selectedPaths.includes(path)) {
            onPathsChange(selectedPaths.filter(p => p !== path));
        } else {
            onPathsChange([...selectedPaths, path]);
        }
    };

    const selectAll = () => onPathsChange(Object.keys(schema));
    const deselectAll = () => onPathsChange([]);
    const selectBasic = () => {
        const basic = Object.keys(schema).filter(p => !p.includes('[]'));
        onPathsChange(basic);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel"
            style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '600px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Select Fields to Export</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Choose the data points you want to include in your CSV. Array fields will be joined into single cells.
                    </p>
                </div>

                <div style={{ position: 'relative', minWidth: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search fields..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 12px 12px 40px',
                            background: 'var(--surface-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" onClick={selectAll} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Select All</button>
                <button className="btn-secondary" onClick={deselectAll} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Deselect All</button>
                <button className="btn-secondary" onClick={selectBasic} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Basic Only</button>
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                maxHeight: '500px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '12px',
                padding: '4px'
            }}>
                {filteredPaths.map(path => {
                    const isSelected = selectedPaths.includes(path);
                    const isArray = path.includes('[]');

                    return (
                        <motion.div
                            key={path}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleToggle(path)}
                            style={{
                                padding: '12px 16px',
                                background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--surface-color)',
                                border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ color: isSelected ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    color: isSelected ? 'white' : 'var(--text-primary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {path}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    {isArray ? (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Layers size={12} /> array (joined)
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Box size={12} /> scalar
                                        </span>
                                    )}
                                </div>
                            </div>

                            <HelpCircle size={14} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                        </motion.div>
                    );
                })}
            </div>

            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                Selected: <strong>{selectedPaths.length}</strong> fields
            </div>
        </motion.div>
    );
};
