import { useState, useMemo } from 'react';
import { SourcePicker } from './components/SourcePicker';
import { FieldSelector } from './components/FieldSelector';
import { PreviewTable } from './components/PreviewTable';
import { ExportPanel } from './components/ExportPanel';
import { buildSchema, flattenTour } from './utils/schema';
import { ChevronRight, ChevronLeft, Download, Eye, ListFilter, FileJson } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export type Step = 'picker' | 'selector' | 'preview' | 'export';

export interface FileInfo {
  file: File;
  name: string;
  isAvailable: boolean;
  content?: any;
}

function App() {
  const [step, setStep] = useState<Step>('picker');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [arraySeparator] = useState('; ');

  const parsableFiles = useMemo(() => files.filter(f => f.isAvailable), [files]);

  const schema = useMemo(() => {
    if (parsableFiles.length === 0) return {};
    // Merge schema from first 50 files
    let mergedSchema = {};
    parsableFiles.slice(0, 50).forEach(f => {
      mergedSchema = buildSchema(f.content, '', mergedSchema);
    });
    return mergedSchema;
  }, [parsableFiles]);

  const previewData = useMemo(() => {
    if (parsableFiles.length === 0 || selectedPaths.length === 0) return [];
    return parsableFiles.slice(0, 5).map(f => flattenTour(f.content, selectedPaths, arraySeparator));
  }, [parsableFiles, selectedPaths, arraySeparator]);

  const handleNext = () => {
    if (step === 'picker') setStep('selector');
    else if (step === 'selector') setStep('preview');
    else if (step === 'preview') setStep('export');
  };

  const handleBack = () => {
    if (step === 'selector') setStep('picker');
    else if (step === 'preview') setStep('selector');
    else if (step === 'export') setStep('preview');
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem 5rem' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--accent-color)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>T</div>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>TripSchemaExporter</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Tour-level CSV Generator</p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-color)', padding: '4px', borderRadius: '12px' }}>
          {[
            { id: 'picker', icon: FileJson, label: 'Source' },
            { id: 'selector', icon: ListFilter, label: 'Fields' },
            { id: 'preview', icon: Eye, label: 'Preview' },
            { id: 'export', icon: Download, label: 'Export' }
          ].map((item) => {
            const isActive = step === item.id;
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: isActive ? 'var(--accent-color)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                <Icon size={16} />
                {item.label}
              </div>
            );
          })}
        </nav>
      </header>

      <main>
        <AnimatePresence mode="wait">
          {step === 'picker' && (
            <SourcePicker
              key="picker"
              files={files}
              onFilesSelected={(newFiles) => {
                setFiles(newFiles);
              }}
              onContinue={() => setStep('selector')}
            />
          )}

          {step === 'selector' && (
            <FieldSelector
              key="selector"
              schema={schema}
              selectedPaths={selectedPaths}
              onPathsChange={setSelectedPaths}
            />
          )}

          {step === 'preview' && (
            <PreviewTable
              key="preview"
              data={previewData}
              selectedPaths={selectedPaths}
            />
          )}

          {step === 'export' && (
            <ExportPanel
              key="export"
              files={parsableFiles}
              selectedPaths={selectedPaths}
              arraySeparator={arraySeparator}
            />
          )}
        </AnimatePresence>
      </main>

      {step !== 'picker' && (
        <footer style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          gap: '1rem'
        }}>
          <button className="btn-secondary" onClick={handleBack} style={{ padding: '12px 32px' }}>
            <ChevronLeft size={20} /> Back
          </button>
          <button
            className="btn-primary"
            onClick={handleNext}
            style={{ padding: '12px 48px' }}
            disabled={step === 'selector' && selectedPaths.length === 0}
          >
            {step === 'preview' ? 'Go to Export' : 'Continue'} <ChevronRight size={20} />
          </button>
        </footer>
      )}
    </div>
  );
}

export default App;
