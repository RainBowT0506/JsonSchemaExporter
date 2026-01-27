import { useState, useMemo, useEffect } from 'react';
import { SourcePicker } from './components/SourcePicker';
import { SchemaTree } from './components/SchemaTree';
import { PreviewTable } from './components/PreviewTable';
import { ExportSettings } from './components/ExportSettings';
import type { ArrayRule } from './components/ExportSettings';
import { NestedDetail } from './components/NestedDetail';
import { buildSchemaTree, mergeSchemaTrees, flattenTour, getAllLeafPaths } from './utils/schema';
import { RefreshCcw, Download } from 'lucide-react';
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
  const [arrayRule, setArrayRule] = useState<ArrayRule>('join');
  const [exportFormat, setExportFormat] = useState<'csv' | 'jsonl'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [inspector, setInspector] = useState<{ data: any; path: string; type: 'object' | 'array' } | null>(null);

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
    if (schemaTree && selectedPaths.length === 0) {
      setSelectedPaths(getAllLeafPaths(schemaTree));
    }
  }, [schemaTree, selectedPaths.length]);
  const handleTogglePath = (path: string, included: boolean) => {
    setSelectedPaths(prev => included ? [...prev, path] : prev.filter(p => p !== path));
  };

  const handleToggleBatch = (paths: string[], included: boolean) => {
    setSelectedPaths(prev => {
      const filtered = prev.filter(p => !paths.includes(p));
      return included ? [...filtered, ...paths] : filtered;
    });
  };

  const previewData = useMemo(() => {
    return files.filter(f => f.isSample && f.isAvailable).map(f => f.content);
  }, [files]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
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

      results.push(...processedChunk.filter(Boolean));
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
      content = results.map(d => JSON.stringify(d)).join('\n');
      extension = 'jsonl';
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
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>TripSchemaExporter <span style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-color)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>PRO</span></h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Advanced Tour-level Data Processor</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={() => window.location.reload()}>
            <RefreshCcw size={16} /> Reset
          </button>
          <button className="btn-primary" onClick={handleExport} disabled={selectedPaths.length === 0 || isExporting}>
            <Download size={16} /> Export
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
