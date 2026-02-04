import React from 'react';
import { Settings, Download, AlertCircle, FileText, Database, HelpCircle, Filter, Search } from 'lucide-react';

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

    // Filter Props
    filterKeyword: string;
    onFilterKeywordChange: (v: string) => void;
    filterColumn: string;
    onFilterColumnChange: (v: string) => void;
    filterMode: 'contains' | 'equals';
    onMatchModeChange: (v: 'contains' | 'equals') => void;
    filterCaseSensitive: boolean;
    onCaseSensitiveChange: (v: boolean) => void;
    availableColumns: string[];
    filteredCount?: number;
    processedCount?: number;
}

const T = {
    zh: {
        title: '匯出設定',
        arrayRule: '陣列聚合規則',
        format: '匯出格式',
        summary: '摘要',
        exporting: '匯出中...',
        button: '現在匯出結果',
        filterTitle: '關鍵字篩選 (Keyword Filter)',
        filterPlaceholder: '輸入關鍵字...',
        allColumns: '全部欄位 (All Columns)',
        matchContains: '包含 (Contains)',
        matchEquals: '完全相等 (Equals)',
        caseSensitive: '區分大小寫',
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
        filterTitle: 'Keyword Filter',
        filterPlaceholder: 'Enter keyword...',
        allColumns: 'All Columns',
        matchContains: 'Contains',
        matchEquals: 'Equals',
        caseSensitive: 'Case Sensitive',
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
    lang,
    filterKeyword,
    onFilterKeywordChange,
    filterColumn,
    onFilterColumnChange,
    filterMode,
    onMatchModeChange,
    filterCaseSensitive,
    onCaseSensitiveChange,
    availableColumns,
    filteredCount,
    processedCount
}) => {
    const texts = T[lang];

    return (
        <div className="export-panel glass-panel" style={{ height: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <Settings size={16} /> {texts.title}
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '4px' }}>
                {/* Filter Section */}
                <div style={{ padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Filter size={14} /> {texts.filterTitle}
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                value={filterKeyword}
                                onChange={(e) => onFilterKeywordChange(e.target.value)}
                                placeholder={texts.filterPlaceholder}
                                style={{ width: '100%', padding: '8px 12px 8px 32px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.9rem' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px' }}>
                        <select
                            value={filterColumn}
                            onChange={(e) => onFilterColumnChange(e.target.value)}
                            style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }}
                        >
                            <option value="ALL">{texts.allColumns}</option>
                            {availableColumns.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>

                        <select
                            value={filterMode}
                            onChange={(e) => onMatchModeChange(e.target.value as 'contains' | 'equals')}
                            style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }}
                        >
                            <option value="contains">{texts.matchContains}</option>
                            <option value="equals">{texts.matchEquals}</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                checked={filterCaseSensitive}
                                onChange={(e) => onCaseSensitiveChange(e.target.checked)}
                                style={{ accentColor: 'var(--accent-color)' }}
                            />
                            <span style={{ color: filterCaseSensitive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{texts.caseSensitive}</span>
                        </label>
                    </div>
                </div>

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
                            <>您正在匯出 <strong>{totalFiles}</strong> 筆資料。{filterKeyword && <>包含關鍵字 <strong>[{filterKeyword}]</strong> 的</>}陣列欄位將使用 <strong>{arrayRule}</strong> 規則處理。</>
                        ) : (
                            <>You are exporting <strong>{totalFiles}</strong> tours.{filterKeyword && <> Arrays matching <strong>[{filterKeyword}]</strong></>} Array fields will be processed using the <strong>{arrayRule}</strong> rule.</>
                        )}
                        {(filteredCount !== undefined || processedCount !== undefined) && (
                            <div style={{ marginTop: '8px', fontWeight: 'bold' }}>
                                Filtered: {filteredCount} / {processedCount || totalFiles}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '16px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}
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
