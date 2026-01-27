import React from 'react';
import { Settings, Download, AlertCircle, FileText, Database, HelpCircle } from 'lucide-react';

export type ArrayRule = 'join' | 'count' | 'first' | 'last' | 'json';

interface ExportSettingsProps {
    arrayRule: ArrayRule;
    onRuleChange: (rule: ArrayRule) => void;
    format: 'csv' | 'json';
    onFormatChange: (format: 'csv' | 'json') => void;
    onExport: () => void;
    isExporting: boolean;
    exportProgress: number;
    totalFiles: number;
    lang: 'zh' | 'en';
}

const T = {
    zh: {
        title: '匯出設定',
        arrayRule: '陣列聚合規則',
        format: '匯出格式',
        summary: '摘要',
        exporting: '匯出中...',
        button: '現在匯出結果',
        ruleHelp: {
            join: '將陣列元素結合為單一字串，以分號 (;) 分隔',
            count: '僅記錄陣列中的元素數量',
            first: '僅取陣列中的第一個元素',
            last: '僅取陣列中的最後一個元素',
            json: '以 JSON 字串形式保留完整陣列'
        }
    },
    en: {
        title: 'Export Settings',
        arrayRule: 'Array Aggregation Rule',
        format: 'Export Format',
        summary: 'Summary',
        exporting: 'Exporting...',
        button: 'Export Results Now',
        ruleHelp: {
            join: 'Combine array elements into a single string separated by (;)',
            count: 'Record only the number of elements in the array',
            first: 'Take only the first element of the array',
            last: 'Take only the last element of the array',
            json: 'Keep the full array as a JSON string'
        }
    }
};

export const ExportSettings: React.FC<ExportSettingsProps> = ({
    arrayRule,
    onRuleChange,
    format,
    onFormatChange,
    onExport,
    isExporting,
    exportProgress,
    totalFiles,
    lang
}) => {
    const texts = T[lang];

    return (
        <div className="export-panel glass-panel" style={{ height: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={16} /> {texts.title}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {texts.arrayRule}
                        <div className="tooltip-container" style={{ position: 'relative', display: 'inline-flex' }}>
                            <HelpCircle size={14} style={{ cursor: 'help', opacity: 0.6 }} />
                            <div className="tooltip" style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                marginBottom: '8px',
                                padding: '8px 12px',
                                background: 'black',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                width: '200px',
                                fontSize: '0.75rem',
                                color: 'white',
                                zIndex: 100,
                                pointerEvents: 'none',
                                opacity: 0,
                                transition: 'opacity 0.2s'
                            }}>
                                {texts.ruleHelp[arrayRule]}
                            </div>
                        </div>
                    </label>
                    <select
                        value={arrayRule}
                        onChange={(e) => onRuleChange(e.target.value as ArrayRule)}
                        style={{ padding: '8px 12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                    >
                        <option value="join">{lang === 'zh' ? '結合為文字 (;)' : 'Join as Text (;)'}</option>
                        <option value="count">{lang === 'zh' ? '計算數量' : 'Count Items'}</option>
                        <option value="first">{lang === 'zh' ? '僅首筆' : 'First Item Only'}</option>
                        <option value="last">{lang === 'zh' ? '僅末筆' : 'Last Item Only'}</option>
                        <option value="json">{lang === 'zh' ? '完整 JSON' : 'Full JSON'}</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{texts.format}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className={`btn-secondary ${format === 'csv' ? 'border-accent' : ''}`}
                            style={{ flex: 1, padding: '8px', fontSize: '0.85rem', borderColor: format === 'csv' ? 'var(--accent-color)' : 'var(--border-color)' }}
                            onClick={() => onFormatChange('csv')}
                        >
                            <FileText size={14} /> CSV
                        </button>
                        <button
                            className={`btn-secondary ${format === 'json' ? 'border-accent' : ''}`}
                            style={{ flex: 1, padding: '8px', fontSize: '0.85rem', borderColor: format === 'json' ? 'var(--accent-color)' : 'var(--border-color)' }}
                            onClick={() => onFormatChange('json')}
                        >
                            <Database size={14} /> JSON
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
                <AlertCircle size={20} className="text-accent" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.85rem' }}>
                    <strong>{texts.summary}:</strong> {lang === 'zh' ? (
                        <>您正在匯出 <strong>{totalFiles}</strong> 筆資料。陣列欄位將使用 <strong>{arrayRule}</strong> 規則處理。</>
                    ) : (
                        <>You are exporting <strong>{totalFiles}</strong> tours. Array fields will be processed using the <strong>{arrayRule}</strong> rule.</>
                    )}
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
                <Download size={20} /> {isExporting ? `${texts.exporting} ${exportProgress}%` : texts.button}
            </button>
        </div>
    );
};
