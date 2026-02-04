import React, { useMemo } from 'react';
import { Settings, Download, AlertCircle, FileText, Database, HelpCircle, Filter, Search, ListTree, ChevronRight } from 'lucide-react';
import type { BreadcrumbTree, BreadcrumbOption } from '../utils/breadcrumb';

export type ArrayRule = 'join' | 'count' | 'first' | 'last' | 'json';
export type FilterType = 'keyword' | 'breadcrumb';

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
    filterType: FilterType;
    onFilterTypeChange: (type: FilterType) => void;

    // Keyword Filter
    filterKeyword: string;
    onFilterKeywordChange: (v: string) => void;
    filterColumn: string;
    onFilterColumnChange: (v: string) => void;
    filterMode: 'contains' | 'equals';
    onMatchModeChange: (v: 'contains' | 'equals') => void;
    filterCaseSensitive: boolean;
    onCaseSensitiveChange: (v: boolean) => void;

    // Breadcrumb Filter
    breadcrumbTree: BreadcrumbTree;
    breadcrumbPath: string[];
    onBreadcrumbPathChange: (path: string[]) => void;
    breadcrumbSourcePath: string;
    onBreadcrumbSourcePathChange: (v: string) => void;

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
        filterTitle: '資料過濾器',
        tabKeyword: '關鍵字過濾',
        tabBreadcrumb: '階層式過濾',
        filterPlaceholder: '輸入關鍵字...',
        allColumns: '全部欄位 (All Columns)',
        matchContains: '包含 (Contains)',
        matchEquals: '完全相等 (Equals)',
        caseSensitive: '區分大小寫',
        sourcePath: '資料來源路徑 (Array Path)',
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
        filterTitle: 'Data Filtering',
        tabKeyword: 'Keyword Filter',
        tabBreadcrumb: 'Breadcrumb Filter',
        filterPlaceholder: 'Enter keyword...',
        allColumns: 'All Columns',
        matchContains: 'Contains',
        matchEquals: 'Equals',
        caseSensitive: 'Case Sensitive',
        sourcePath: 'Source Data Path',
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
    filterType,
    onFilterTypeChange,
    filterKeyword,
    onFilterKeywordChange,
    filterColumn,
    onFilterColumnChange,
    filterMode,
    onMatchModeChange,
    filterCaseSensitive,
    onCaseSensitiveChange,
    breadcrumbTree,
    breadcrumbPath,
    onBreadcrumbPathChange,
    breadcrumbSourcePath,
    onBreadcrumbSourcePathChange,
    availableColumns,
    filteredCount,
    processedCount
}) => {
    const texts = T[lang];

    // Calculate options for the next level
    // We always show N+1 dropdowns where N is current path length
    // But practically, we show existing levels + 1 if there are children.

    const levels = useMemo(() => {
        const result: { options: BreadcrumbOption[], value: string }[] = [];

        let currentOptions = Array.from(breadcrumbTree.values());

        // Always add the first level
        if (currentOptions.length > 0) {
            result.push({
                options: currentOptions,
                value: breadcrumbPath[0] || ''
            });
        }

        // Walk down the path to add subsequent levels
        for (let i = 0; i < breadcrumbPath.length; i++) {
            const code = breadcrumbPath[i];
            if (!code) break;

            const selectedNode = currentOptions.find(opt => opt.code === code);
            if (selectedNode && selectedNode.children.size > 0) {
                currentOptions = Array.from(selectedNode.children.values());
                result.push({
                    options: currentOptions,
                    value: breadcrumbPath[i + 1] || '' // The next value in path, or empty for the new dropdown
                });
            } else {
                break;
            }
        }
        return result;
    }, [breadcrumbTree, breadcrumbPath]);

    const handleLevelChange = (levelIndex: number, newValue: string) => {
        const newPath = [...breadcrumbPath];
        newPath[levelIndex] = newValue;
        // Truncate any deeper selections if we change a parent
        const truncatedPath = newPath.slice(0, levelIndex + 1);
        onBreadcrumbPathChange(truncatedPath);
    };

    return (
        <div className="export-panel glass-panel" style={{ height: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <Settings size={16} /> {texts.title}
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '4px' }}>
                {/* Filter Section */}
                <div style={{ padding: '0', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                        <button
                            onClick={() => onFilterTypeChange('keyword')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                fontSize: '0.85rem',
                                background: filterType === 'keyword' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                color: filterType === 'keyword' ? 'var(--accent-color)' : 'var(--text-secondary)',
                                fontWeight: filterType === 'keyword' ? 600 : 400,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                borderRight: '1px solid var(--border-color)',
                                cursor: 'pointer'
                            }}
                        >
                            <Filter size={14} /> {texts.tabKeyword}
                        </button>
                        <button
                            onClick={() => onFilterTypeChange('breadcrumb')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                fontSize: '0.85rem',
                                background: filterType === 'breadcrumb' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                color: filterType === 'breadcrumb' ? 'var(--accent-color)' : 'var(--text-secondary)',
                                fontWeight: filterType === 'breadcrumb' ? 600 : 400,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            <ListTree size={14} /> {texts.tabBreadcrumb}
                        </button>
                    </div>

                    {/* Filter Content */}
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filterType === 'keyword' ? (
                            <>
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
                            </>
                        ) : (
                            // Breadcrumb Filter UI
                            <>
                                <div style={{ marginBottom: '4px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                                        {texts.sourcePath}
                                    </label>
                                    <input
                                        type="text"
                                        value={breadcrumbSourcePath}
                                        onChange={(e) => onBreadcrumbSourcePathChange(e.target.value)}
                                        style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.8rem', fontFamily: 'monospace' }}
                                    />
                                </div>

                                {levels.map((level, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', animation: 'fadeIn 0.2s' }}>
                                        {idx > 0 && <ChevronRight size={14} className="text-secondary" style={{ flexShrink: 0 }} />}
                                        <select
                                            value={level.value}
                                            onChange={(e) => handleLevelChange(idx, e.target.value)}
                                            style={{
                                                padding: '8px 12px',
                                                background: 'rgba(0,0,0,0.2)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '6px',
                                                color: 'white',
                                                fontSize: '0.9rem',
                                                width: '100%'
                                            }}
                                        >
                                            <option value="">{lang === 'zh' ? `選擇 Level ${idx + 1}...` : `Select Level ${idx + 1}...`}</option>
                                            {level.options.map(opt => (
                                                <option key={opt.code} value={opt.code}>
                                                    {opt.name} ({opt.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ))}

                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                                    {breadcrumbPath.length > 0 && breadcrumbPath[0] !== '' && (
                                        <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => onBreadcrumbPathChange([])}>Clear Filter</span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flexShrink: 0 }}>
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
                                className={`btn - secondary ${format === 'csv' ? 'border-accent' : ''} `}
                                style={{ flex: 1, padding: '8px', fontSize: '0.85rem', borderColor: format === 'csv' ? 'var(--accent-color)' : 'var(--border-color)' }}
                                onClick={() => onFormatChange('csv')}
                            >
                                <FileText size={14} /> CSV
                            </button>
                            <button
                                className={`btn - secondary ${format === 'json' ? 'border-accent' : ''} `}
                                style={{ flex: 1, padding: '8px', fontSize: '0.85rem', borderColor: format === 'json' ? 'var(--accent-color)' : 'var(--border-color)' }}
                                onClick={() => onFormatChange('json')}
                            >
                                <Database size={14} /> JSON
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)', display: 'flex', gap: '12px', flexShrink: 0 }}>
                    <AlertCircle size={20} className="text-accent" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.85rem' }}>
                        <strong>{texts.summary}:</strong> {lang === 'zh' ? (
                            <>您正在匯出 <strong>{totalFiles}</strong> 筆資料。</>
                        ) : (
                            <>You are exporting <strong>{totalFiles}</strong> tours.</>
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
                        width: `${exportProgress}% `,
                        background: 'rgba(255, 255, 255, 0.1)',
                        transition: 'width 0.3s ease'
                    }} />
                )}
                <Download size={20} /> {isExporting ? `${texts.exporting} ${exportProgress}% ` : texts.button}
            </button>
        </div>
    );
};
