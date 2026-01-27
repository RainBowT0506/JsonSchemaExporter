import React from 'react';
import { Settings, Download, AlertCircle, FileText, Database } from 'lucide-react';

export type ArrayRule = 'join' | 'count' | 'first' | 'last' | 'json';

interface ExportSettingsProps {
    arrayRule: ArrayRule;
    onRuleChange: (rule: ArrayRule) => void;
    format: 'csv' | 'jsonl';
    onFormatChange: (format: 'csv' | 'jsonl') => void;
    onExport: () => void;
    isExporting: boolean;
    exportProgress: number;
    totalFiles: number;
}

export const ExportSettings: React.FC<ExportSettingsProps> = ({
    arrayRule,
    onRuleChange,
    format,
    onFormatChange,
    onExport,
    isExporting,
    exportProgress,
    totalFiles
}) => {
    return (
        <div className="export-panel glass-panel" style={{ height: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={16} /> Export Settings
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Array Aggregation Rule</label>
                    <select
                        value={arrayRule}
                        onChange={(e) => onRuleChange(e.target.value as ArrayRule)}
                        style={{ padding: '8px 12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                    >
                        <option value="join">Join as Text (;)</option>
                        <option value="count">Count Items</option>
                        <option value="first">First Item Only</option>
                        <option value="last">Last Item Only</option>
                        <option value="json">Full JSON</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Export Format</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className={`btn-secondary ${format === 'csv' ? 'border-accent' : ''}`}
                            style={{ flex: 1, padding: '8px', fontSize: '0.85rem', borderColor: format === 'csv' ? 'var(--accent-color)' : 'var(--border-color)' }}
                            onClick={() => onFormatChange('csv')}
                        >
                            <FileText size={14} /> CSV
                        </button>
                        <button
                            className={`btn-secondary ${format === 'jsonl' ? 'border-accent' : ''}`}
                            style={{ flex: 1, padding: '8px', fontSize: '0.85rem', borderColor: format === 'jsonl' ? 'var(--accent-color)' : 'var(--border-color)' }}
                            onClick={() => onFormatChange('jsonl')}
                        >
                            <Database size={14} /> JSONL
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
                <AlertCircle size={20} className="text-accent" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.85rem' }}>
                    <strong>Summary:</strong> You are exporting <strong>{totalFiles}</strong> tours. Array fields will be processed using the <strong>{arrayRule}</strong> rule.
                </div>
            </div>

            <div style={{ flex: 1 }} />

            <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '16px', position: 'relative', overflow: 'hidden' }}
                onClick={onExport}
                disabled={isExporting}
            >
                {isExporting && (
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${exportProgress}%`,
                        background: 'rgba(255, 255, 255, 0.1)',
                        transition: 'width 0.3s ease'
                    }} />
                )}
                <Download size={20} /> {isExporting ? `Exporting... ${exportProgress}%` : 'Export Results Now'}
            </button>
        </div>
    );
};
