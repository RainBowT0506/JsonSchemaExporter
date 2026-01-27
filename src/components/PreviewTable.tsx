import React from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { getValueByPath } from '../utils/schema';

interface PreviewTableProps {
    data: any[];
    selectedPaths: string[];
    onInspect: (data: any, path: string, type: 'object' | 'array') => void;
}

export const PreviewTable: React.FC<PreviewTableProps> = ({
    data,
    selectedPaths,
    onInspect
}) => {
    const renderCell = (row: any, path: string) => {
        const val = getValueByPath(row, path);

        if (val === undefined || val === null || (Array.isArray(val) && val.length === 0)) {
            return <span style={{ color: 'var(--text-secondary)', opacity: 0.3 }}>-</span>;
        }

        if (Array.isArray(val)) {
            // If it's a flat array of primitives, join them
            if (val.every(v => typeof v !== 'object')) {
                const str = val.join('; ');
                return <div className="smart-cell" title={str}>{str}</div>;
            }
            return (
                <div className="smart-cell" onClick={() => onInspect(val, path, 'array')}>
                    <span className="smart-cell-tag tag-array">Array</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{val.length} items</span>
                </div>
            );
        }

        if (typeof val === 'object') {
            const keys = Object.keys(val).length;
            return (
                <div className="smart-cell" onClick={() => onInspect(val, path, 'object')}>
                    <span className="smart-cell-tag tag-object">Object</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{keys} keys</span>
                </div>
            );
        }

        const strVal = String(val);
        return (
            <div className="smart-cell" title={strVal}>
                {strVal}
            </div>
        );
    };

    if (selectedPaths.length === 0) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                    <Info size={16} />
                    <span><strong>Preview Mode:</strong> Only the first 5 tours are shown here for performance. The full dataset will be processed during export.</span>
                </div>
                <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '1rem' }}>
                    <HelpCircle size={48} opacity={0.2} />
                    <p>Select fields from the explorer to see a preview</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                <Info size={16} />
                <span><strong>Preview Mode:</strong> Only the first 5 tours are shown here for performance. The full dataset will be processed during export.</span>
            </div>
            <div className="preview-table-container glass-panel" style={{ flex: 1, overflow: 'auto' }}>
                <table className="preview-table">
                    <thead>
                        <tr>
                            {selectedPaths.map(path => (
                                <th key={path}>{path}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i}>
                                {selectedPaths.map(path => (
                                    <td key={path}>{renderCell(row, path)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
