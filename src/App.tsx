import { useState, useMemo, useEffect, useRef } from 'react';
import { SourcePicker } from './components/SourcePicker';
import { SchemaTree } from './components/SchemaTree';
import { PreviewTable } from './components/PreviewTable';
import { ExportSettings } from './components/ExportSettings';
import type { FilterType, ArrayRule } from './components/ExportSettings';
import { NestedDetail } from './components/NestedDetail';
import { buildSchemaTree, mergeSchemaTrees, flattenTour, getAllLeafPaths, filterFlattenedData } from './utils/schema';
import { buildBreadcrumbTree, matchBreadcrumb } from './utils/breadcrumb';
import { RefreshCcw, Download, Languages, GripHorizontal } from 'lucide-react';
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
  const [filterType, setFilterType] = useState<FilterType>('keyword');

  // Keyword Filter
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterColumn, setFilterColumn] = useState('ALL');
  const [filterMode, setFilterMode] = useState<'contains' | 'equals'>('contains');
  const [filterCaseSensitive, setFilterCaseSensitive] = useState(false);

  // Breadcrumb Filter
  const [breadcrumbSourcePath, setBreadcrumbSourcePath] = useState('queries.getCommBreadcrumb');
  const [breadcrumbPath, setBreadcrumbPath] = useState<string[]>([]);

  // Metrics
  const [filteredCount, setFilteredCount] = useState<number | undefined>(undefined);
  const [processedCount, setProcessedCount] = useState<number | undefined>(undefined);
  const [schemaSourceCount, setSchemaSourceCount] = useState<number>(0);

  const [isExporting, setIsExporting] = useState(false);
  const [isScanning, setIsScanning] = useState(false); // Scanning feedback
  const [exportProgress, setExportProgress] = useState(0);
  const [inspector, setInspector] = useState<{ data: any; path: string; type: 'object' | 'array' } | null>(null);

  // Layout State
  const [previewHeightPercent, setPreviewHeightPercent] = useState(() => {
    const saved = localStorage.getItem('previewHeightPercent');
    return saved ? parseFloat(saved) : 30; // Default 30%
  });
  const splitterRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Persistence for non-path settings
  useEffect(() => {
    localStorage.setItem('arrayRule', arrayRule);
    localStorage.setItem('exportFormat', exportFormat);
    localStorage.setItem('lang', lang);
  }, [arrayRule, exportFormat, lang]);

  // Derive Schema Tree from valid files (Dynamic)
  // Derive Schema Tree from valid files (Dynamic with Distributed Sampling)
  const schemaTree = useMemo(() => {
    // Collect ALL matches first
    const matches: any[] = [];

    for (const f of files) {
      if (!f.isAvailable || !f.content) continue;

      let shouldInclude = true;
      if (filterType === 'breadcrumb' && breadcrumbPath[0]) {
        shouldInclude = matchBreadcrumb(f.content, breadcrumbSourcePath, breadcrumbPath);
      }

      if (shouldInclude) {
        matches.push(f.content);
      }
    }

    if (matches.length === 0) return null;

    // Distributed Sampling:
    // Instead of taking the first N, we take N samples distributed across the set.
    // This ensures we capture schema variations if the file list is sorted by type.
    const MAX_SCHEMA_SAMPLES = 1000; // Increased to capture more unique fields
    let samples = matches;

    if (matches.length > MAX_SCHEMA_SAMPLES) {
      samples = [];
      const step = matches.length / MAX_SCHEMA_SAMPLES;
      for (let i = 0; i < MAX_SCHEMA_SAMPLES; i++) {
        const index = Math.floor(i * step);
        if (matches[index]) {
          samples.push(matches[index]);
        }
      }
    }

    let merged = buildSchemaTree(samples[0]);
    samples.slice(1).forEach(content => {
      const nextPlan = buildSchemaTree(content);
      merged = mergeSchemaTrees(merged, nextPlan);
    });
    return merged;
  }, [files, filterType, breadcrumbPath, breadcrumbSourcePath]);

  // Update schema source count separate from memo
  useEffect(() => {
    let count = 0;
    for (const f of files) {
      if (!f.isAvailable || !f.content) continue;
      let shouldInclude = true;
      if (filterType === 'breadcrumb' && breadcrumbPath[0]) {
        shouldInclude = matchBreadcrumb(f.content, breadcrumbSourcePath, breadcrumbPath);
      }
      if (shouldInclude) count++;
    }
    setSchemaSourceCount(count);
  }, [files, filterType, breadcrumbPath, breadcrumbSourcePath]);

  // Helper to scan all files for Indexing (Breadcrumb) & Full Schema
  const scanAllFiles = async () => {
    if (isScanning) return;
    setIsScanning(true);

    // Work on a copy of the current state
    const currentFiles = [...files];
    let hasUpdates = false;
    const CHUNK_SIZE = 50; // Larger chunk for faster throughput

    try {
      const unparsedIndices = currentFiles
        .map((f, i) => (!f.content && f.isAvailable ? i : -1))
        .filter(i => i !== -1);

      if (unparsedIndices.length > 0) {
        for (let i = 0; i < unparsedIndices.length; i += CHUNK_SIZE) {
          const chunkIndices = unparsedIndices.slice(i, i + CHUNK_SIZE);

          await Promise.all(chunkIndices.map(async (idx) => {
            const f = currentFiles[idx];
            try {
              const text = await f.file.text();
              f.content = JSON.parse(text);
              hasUpdates = true;
            } catch (e) {
              console.error('Lazy parse failed', f.name);
            }
          }));

          // Incrementally update state so schema grows visibly
          if (hasUpdates) {
            setFiles([...currentFiles]);
          }

          // Yield to UI
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Trigger scan when switching to Breadcrumb mode
  // Trigger scan automatically if there are unparsed files
  useEffect(() => {
    const hasUnparsed = files.some(f => f.isAvailable && !f.content);
    if (hasUnparsed) {
      scanAllFiles();
    }
  }, [files]);

  // Derive Breadcrumb Tree
  const breadcrumbTree = useMemo(() => {
    // Now uses all available files since we scan them.
    return buildBreadcrumbTree(files.filter(f => f.isAvailable), breadcrumbSourcePath);
  }, [files, breadcrumbSourcePath]);

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

      // Sync selection with available schema (Remove ghosts)
      if (selectedPaths.length > 0) {
        const validPaths = selectedPaths.filter(p => allLeafPaths.includes(p));
        // Only update if we have invalid/ghost paths
        if (validPaths.length !== selectedPaths.length) {
          setSelectedPaths(validPaths);
          // If validPaths becomes empty here (e.g. total mismatch), 
          // the next block will catch it and select ALL, which is usually desired behavior when switching contexts.
          if (validPaths.length === 0) {
            setSelectedPaths(allLeafPaths);
            return;
          }
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
    // If no filter is active, return the specific "isSample" files (the first few loaded)
    const initialSamples = files.filter(f => f.isSample && f.isAvailable && f.content).map(f => f.content);

    if (filterType === 'keyword' && !filterKeyword) return initialSamples;
    if (filterType === 'breadcrumb' && (!breadcrumbPath[0])) return initialSamples;

    // If filtering, we want to find ACTUAL matches from ANY loaded file, 
    // to avoid the "Preview Empty" issue when the match is in file #100.
    const matches: any[] = [];

    for (const f of files) {
      if (!f.isAvailable || !f.content) continue;

      let isMatch = true;

      if (filterType === 'breadcrumb') {
        isMatch = matchBreadcrumb(f.content, breadcrumbSourcePath, breadcrumbPath);
      } else if (filterType === 'keyword') {
        const flattened = flattenTour(f.content, selectedPaths, arrayRule);
        isMatch = filterFlattenedData(flattened, filterKeyword, filterColumn, filterMode, filterCaseSensitive);
      }

      if (isMatch) {
        matches.push(f.content);
        if (matches.length >= 10) break; // Limit preview to 10 items for performance
      }
    }

    return matches;
  }, [files, filterType, filterKeyword, filterColumn, filterMode, filterCaseSensitive, breadcrumbPath, breadcrumbSourcePath, selectedPaths, arrayRule]);

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

          // Check Pre-filter (Raw Data Check for Breadcrumb)
          if (filterType === 'breadcrumb') {
            if (breadcrumbPath[0] && !matchBreadcrumb(content, breadcrumbSourcePath, breadcrumbPath)) {
              return null;
            }
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

      // Apply Post-filter (Flattened Data Check for Keyword)
      const validItems = processedChunk.filter((item: any) => {
        if (!item) return false;
        if (filterType === 'keyword') {
          return filterFlattenedData(item, filterKeyword, filterColumn, filterMode, filterCaseSensitive);
        }
        return true; // Breadcrumb was checked before flattening
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

  // Resizable Split Pane Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - containerRect.top;
    const newPercentage = (relativeY / containerRect.height) * 100;
    // Clamp between 10% and 80%
    const clamped = Math.max(10, Math.min(80, newPercentage));
    setPreviewHeightPercent(clamped);
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    localStorage.setItem('previewHeightPercent', String(previewHeightPercent));
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
      <header style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              sourceCount={schemaSourceCount}
              isScanning={isScanning}
            />
          )}
        </aside>

        {/* Main Content Area with Split Pane */}
        <div className="main-content" ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Top Pane: Preview (Resizable) */}
          <section className="preview-section" style={{ height: `${previewHeightPercent}%`, minHeight: '100px', overflow: 'hidden' }}>
            <PreviewTable
              data={previewData}
              selectedPaths={selectedPaths}
              onInspect={(data, path, type) => setInspector({ data, path, type })}
            />
          </section>

          {/* Splitter Handle */}
          <div
            ref={splitterRef}
            onMouseDown={handleMouseDown}
            style={{
              height: '12px',
              background: 'var(--surface-color)',
              borderTop: '1px solid var(--border-color)',
              borderBottom: '1px solid var(--border-color)',
              cursor: 'row-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              zIndex: 10
            }}
          >
            <GripHorizontal size={14} color="var(--text-secondary)" />
          </div>

          {/* Bottom Pane: Settings (Fills remaining) */}
          <section className="export-section" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
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

              filterType={filterType}
              onFilterTypeChange={setFilterType}

              filterKeyword={filterKeyword}
              onFilterKeywordChange={setFilterKeyword}
              filterColumn={filterColumn}
              onFilterColumnChange={setFilterColumn}
              filterMode={filterMode}
              onMatchModeChange={setFilterMode}
              filterCaseSensitive={filterCaseSensitive}
              onCaseSensitiveChange={setFilterCaseSensitive}

              breadcrumbTree={breadcrumbTree}
              breadcrumbPath={breadcrumbPath}
              onBreadcrumbPathChange={setBreadcrumbPath}
              breadcrumbSourcePath={breadcrumbSourcePath}
              onBreadcrumbSourcePathChange={setBreadcrumbSourcePath}

              availableColumns={selectedPaths}
              filteredCount={filteredCount}
              processedCount={processedCount}
            />
          </section>
        </div>
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
