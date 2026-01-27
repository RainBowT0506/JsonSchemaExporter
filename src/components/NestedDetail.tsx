import React from 'react';
import { X, Box, Layers, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface NestedDetailProps {
    data: any;
    path: string;
    type: 'object' | 'array';
    onClose: () => void;
}

export const NestedDetail: React.FC<NestedDetailProps> = ({ data, path, type, onClose }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="detail-drawer">
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {type === 'object' ? <Box className="text-accent" /> : <Layers className="text-warning" />}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{path.split('.').pop() || 'Detail'}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{path}</p>
                    </div>
                </div>
                <button className="btn-secondary" style={{ padding: '8px' }} onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {type === 'array' ? `${data.length} items` : `${Object.keys(data).length} keys`}
                    </span>
                    <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={handleCopy}>
                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy JSON'}
                    </button>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)' }}>
                    {type === 'array' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {data.map((item: any, i: number) => (
                                <div key={i} style={{ padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Item #{i + 1}</div>
                                    <pre style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                                        {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <pre style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
};
