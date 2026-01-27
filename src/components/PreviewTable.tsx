import React from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, AlertTriangle } from 'lucide-react';

interface PreviewTableProps {
    data: any[];
    selectedPaths: string[];
}

export const PreviewTable: React.FC<PreviewTableProps> = ({
    data,
    selectedPaths
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel"
            style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}
        >
            <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileSpreadsheet style={{ color: 'var(--accent-color)' }} /> CSV Preview (Tour-level)
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Showing a preview of the first 5 records. Each TourID is represented by exactly one row.
                </p>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--surface-color)', textAlign: 'left' }}>
                            {selectedPaths.map(path => (
                                <th key={path} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {path}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} style={{ borderBottom: i === data.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                                {selectedPaths.map(path => {
                                    const val = String(row[path]);
                                    const isLong = val.length > 100;
                                    return (
                                        <td
                                            key={path}
                                            style={{
                                                padding: '12px 16px',
                                                color: 'var(--text-primary)',
                                                maxWidth: '300px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                            title={val}
                                        >
                                            {val || <span style={{ color: 'var(--text-secondary)', opacity: 0.3 }}>-</span>}
                                            {isLong && <span style={{ marginLeft: '4px' }}>...</span>}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {data.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No records to display. Please select at least one field.
                </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid var(--warning-color)',
                    padding: '1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    gap: '12px',
                    fontSize: '0.85rem',
                    color: 'var(--warning-color)'
                }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <div>
                        <strong>Tour-level Rule:</strong> All array data has been flattened into single cells using the default separator (;).
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
