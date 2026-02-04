import { useState, useMemo, useEffect } from 'react';
import { SourcePicker } from './components/SourcePicker';
import { SchemaTree } from './components/SchemaTree';
import { PreviewTable } from './components/PreviewTable';
import { ExportSettings } from './components/ExportSettings';
import type { ArrayRule } from './components/ExportSettings';
import { NestedDetail } from './components/NestedDetail';
import { buildSchemaTree, mergeSchemaTrees, flattenTour, getAllLeafPaths, filterFlattenedData } from './utils/schema';
import { RefreshCcw, Download, Languages } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';

export interface FileInfo {
  file: File;
  name: string;
  isAvailable: boolean;
  content?: any;
  isSample?: boolean;
}

function App() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [arrayRule, setArrayRule] = useState<ArrayRule>(() => (localStorage.getItem('arrayRule') as ArrayRule) || 'join');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>(() => (localStorage.getItem('exportFormat') as 'csv' | 'json') || 'csv');
  const [lang, setLang] = useState<'zh' | 'en'>(() => (localStorage.getItem('lang') as 'zh' | 'en') || 'zh');

  // Filter State
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterColumn, setFilterColumn] = useState('ALL');
  const [filterMode, setFilterMode] = useState<'contains' | 'equals'>('contains');
  const [filterCaseSensitive, setFilterCaseSensitive] = useState(false);
  const [filteredCount, setFilteredCount] = useState<number | undefined>(undefined);
  const [processedCount, setProcessedCount] = useState<number | undefined>(undefined);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [inspector, setInspector] = useState<{ data: any; path: string; type: 'object' | 'array' } | null>(null);

  // Persistence for non-path settings
  useEffect(() => {
    localStorage.setItem('arrayRule', arrayRule);
    localStorage.setItem('exportFormat', exportFormat);
    localStorage.setItem('lang', lang);
  }, [arrayRule, exportFormat, lang]);

  // Derive Schema Tree from sample files
  const schemaTree = useMemo(() => {
    const samples = files.filter(f => f.isSample && f.isAvailable);
    if (samples.length === 0) return null;

    let merged = buildSchemaTree(samples[0].content);
    samples.slice(1).forEach(f => {
      const nextPlan = buildSchemaTree(f.content);
      merged = mergeSchemaTrees(merged, nextPlan);
    });
    return merged;
  }, [files]);

  // Default select all fields when schema is first ready
  useEffect(() => {
    if (schemaTree) {
      const allLeafPaths = getAllLeafPaths(schemaTree);

      // Load selected paths from localStorage if available and matching current schema
      const savedPathsRaw = localStorage.getItem('selectedPaths');
      if (savedPathsRaw && selectedPaths.length === 0) {
        try {
          const savedPaths = JSON.parse(savedPathsRaw) as string[];
          // Filter out paths that don't exist in current schema
          const validPaths = savedPaths.filter(p => allLeafPaths.includes(p));
          if (validPaths.length > 0) {
            setSelectedPaths(validPaths);
            return;
          }
        } catch (e) {
          console.error('Failed to load saved paths', e);
        }
      }

      // Fallback to selecting all
      if (selectedPaths.length === 0) {
        setSelectedPaths(allLeafPaths);
      }
    }
  }, [schemaTree]);

  // Save selected paths
  useEffect(() => {
    if (selectedPaths.length > 0) {
      localStorage.setItem('selectedPaths', JSON.stringify(selectedPaths));
    }
  }, [selectedPaths]);

  // Helper to maintain path order based on schema
  const sortPaths = (paths: string[]) => {
    if (!schemaTree) return paths;
    const allPaths = getAllLeafPaths(schemaTree);
    return [...paths].sort((a, b) => allPaths.indexOf(a) - allPaths.indexOf(b));
  };

  const handleTogglePath = (path: string, included: boolean) => {
    setSelectedPaths(prev => {
      const next = included ? [...prev, path] : prev.filter(p => p !== path);
      return sortPaths(next);
    });
  };

  const handleToggleBatch = (paths: string[], included: boolean) => {
    setSelectedPaths(prev => {
      const filtered = prev.filter(p => !paths.includes(p));
      const next = included ? [...filtered, ...paths] : filtered;
      return sortPaths(next);
    });
  };

  const previewData = useMemo(() => {
    const samples = files.filter(f => f.isSample && f.isAvailable).map(f => f.content);
    if (!filterKeyword) return samples;

    // Apply Filter to Samples
    return samples.filter(item => {
      const flattened = flattenTour(item, selectedPaths, arrayRule);
      return filterFlattenedData(flattened, filterKeyword, filterColumn, filterMode, filterCaseSensitive);
    });
  }, [files, filterKeyword, filterColumn, filterMode, filterCaseSensitive, selectedPaths, arrayRule]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setFilteredCount(0);
    setProcessedCount(0);

    const parsable = files.filter(f => f.isAvailable);
    const total = parsable.length;
    const results: any[] = [];

    // Process in chunks to maintain UI responsiveness and memory safety
    const CHUNK_SIZE = 50;
    for (let i = 0; i < total; i += CHUNK_SIZE) {
      const chunk = parsable.slice(i, i + CHUNK_SIZE);
      const processedChunk = await Promise.all(chunk.map(async (f) => {
        try {
          let content = f.content;
          if (!content) {
            const text = await f.file.text();
            content = JSON.parse(text);
          }
          const flattened = flattenTour(content, selectedPaths, arrayRule);
          flattened['TourID_Meta'] = content.TourID || 'UNKNOWN';
          flattened['SourceFile'] = f.name;
          return flattened;
        } catch (e) {
          console.error(`Failed to process ${f.name}`, e);
          return null;
        }
      }));

      // Apply Filter
      const validItems = processedChunk.filter((item: any) => {
        if (!item) return false;
        return filterFlattenedData(item, filterKeyword, filterColumn, filterMode, filterCaseSensitive);
      });

      results.push(...validItems);
      setFilteredCount(prev => (prev || 0) + validItems.length);
      setProcessedCount(prev => (prev || 0) + chunk.length);

      setExportProgress(Math.min(100, Math.round(((i + chunk.length) / total) * 100)));
      // Yield to main thread
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    let content: string;
    let extension: string;

    if (exportFormat === 'csv') {
      content = Papa.unparse(results);
      extension = 'csv';
    } else {
      content = JSON.stringify(results, null, 2);
      extension = 'json';
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trip_export_${Date.now()}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExporting(false);
    setExportProgress(0);
  };

  if (files.length === 0) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SourcePicker
          files={files}
          onFilesSelected={setFiles}
          onContinue={() => { }} // No longer needed for single-page but kept for component compatibility
        />
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--accent-color)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>T</div>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Json Schema Exporter <span style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-color)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>PRO</span></h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Advanced Tour-level Data Processor</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')}>
            <Languages size={16} /> {lang.toUpperCase()}
          </button>
          <button className="btn-secondary" onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}>
            <RefreshCcw size={16} /> {lang === 'zh' ? '重置' : 'Reset'}
          </button>
          <button className="btn-primary" onClick={handleExport} disabled={selectedPaths.length === 0 || isExporting}>
            <Download size={16} /> {lang === 'zh' ? '匯出' : 'Export'}
          </button>
        </div>
      </header>

      <div className="dashboard">
        <aside className="explorer-section">
          {schemaTree && (
            <SchemaTree
              tree={schemaTree}
              selectedPaths={selectedPaths}
              onTogglePath={handleTogglePath}
              onToggleBatch={handleToggleBatch}
            />
          )}
        </aside>

        <section className="preview-section">
          <PreviewTable
            data={previewData}
            selectedPaths={selectedPaths}
            onInspect={(data, path, type) => setInspector({ data, path, type })}
          />
        </section>

        <section className="export-section">
          <ExportSettings
            totalFiles={files.filter(f => f.isAvailable).length}
            arrayRule={arrayRule}
            onRuleChange={setArrayRule}
            format={exportFormat}
            onFormatChange={setExportFormat}
            onExport={handleExport}
            isExporting={isExporting}
            exportProgress={exportProgress}
            lang={lang}

            filterKeyword={filterKeyword}
            onFilterKeywordChange={setFilterKeyword}
            filterColumn={filterColumn}
            onFilterColumnChange={setFilterColumn}
            filterMode={filterMode}
            onMatchModeChange={setFilterMode}
            filterCaseSensitive={filterCaseSensitive}
            onCaseSensitiveChange={setFilterCaseSensitive}
            availableColumns={selectedPaths}
            filteredCount={filteredCount}
            processedCount={processedCount}
          />
        </section>
      </div>

      <AnimatePresence>
        {inspector && (
          <NestedDetail
            data={inspector.data}
            path={inspector.path}
            type={inspector.type}
            onClose={() => setInspector(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
