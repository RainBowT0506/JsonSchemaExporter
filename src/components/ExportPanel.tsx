import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle2, XCircle, FileJson, Loader2, RefreshCcw, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';
import { flattenTour } from '../utils/schema';

interface ExportPanelProps {
    files: any[];
    selectedPaths: string[];
    arraySeparator: string;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
    files,
    selectedPaths,
    arraySeparator
}) => {
    const [isExporting, setIsExporting] = useState(false);
    const [result, setResult] = useState<{
        success: any[];
        failures: any[];
        csvUrl?: string;
        successUrl?: string;
        failureUrl?: string;
    } | null>(null);

    const handleExport = async () => {
        setIsExporting(true);

        setTimeout(() => {
            const success: any[] = [];
            const failures: any[] = [];

            files.forEach(fileInfo => {
                try {
                    const flattened = flattenTour(fileInfo.content, selectedPaths, arraySeparator);
                    flattened['TourID_Source'] = fileInfo.content.TourID || 'UNKNOWN';
                    flattened['SourceFile'] = fileInfo.name;
                    flattened['ExportedAt'] = new Date().toISOString();

                    success.push(flattened);
                } catch (err: any) {
                    failures.push({
                        tour_id: fileInfo.content?.TourID || 'UNKNOWN',
                        source_file: fileInfo.name,
                        error_code: 'E_EXPORT_FAILED',
                        message: err.message || 'Unknown error during flattening'
                    });
                }
            });

            const csv = Papa.unparse(success);
            const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const csvUrl = URL.createObjectURL(csvBlob);

            const successBlob = new Blob([JSON.stringify(success, null, 2)], { type: 'application/json' });
            const successUrl = URL.createObjectURL(successBlob);

            const failureBlob = new Blob([JSON.stringify(failures, null, 2)], { type: 'application/json' });
            const failureUrl = URL.createObjectURL(failureBlob);

            setResult({ success, failures, csvUrl, successUrl, failureUrl });
            setIsExporting(false);
        }, 1000);
    };

    const downloadFile = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel"
            style={{ padding: '3rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}
        >
            {!result ? (
                <>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'var(--surface-color)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        color: 'var(--accent-color)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <Download size={40} />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Ready to Export</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
                        You are about to export <strong>{files.length}</strong> records with <strong>{selectedPaths.length}</strong> fields each.
                    </p>

                    <button
                        className="btn-primary"
                        style={{ padding: '16px 64px', fontSize: '1.25rem' }}
                        disabled={isExporting}
                        onClick={handleExport}
                    >
                        {isExporting ? <><Loader2 className="animate-spin" /> Processing...</> : 'Generate Files Now'}
                    </button>
                </>
            ) : (
                <>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        color: 'var(--success-color)',
                        border: '1px solid var(--success-color)'
                    }}>
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Export Complete!</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', margin: '2rem 0', textAlign: 'left' }}>
                        <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <div style={{ color: 'var(--success-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                                <CheckCircle2 size={18} /> Success
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{result.success.length} rows</div>
                        </div>
                        <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <div style={{ color: result.failures.length > 0 ? 'var(--error-color)' : 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                                <XCircle size={18} /> Failures
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{result.failures.length} files</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={() => downloadFile(result.csvUrl!, 'tour_level_export.csv')}
                        >
                            <FileSpreadsheet size={20} /> Download CSV Result
                        </button>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                className="btn-secondary"
                                onClick={() => downloadFile(result.successUrl!, 'export_success.json')}
                            >
                                <FileJson size={18} /> Success Log
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => downloadFile(result.failureUrl!, 'export_failures.json')}
                                disabled={result.failures.length === 0}
                            >
                                <FileJson size={18} /> Failure Log
                            </button>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                marginTop: '2rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <RefreshCcw size={14} /> Start New Export
                        </button>
                    </div>
                </>
            )}
        </motion.div>
    );
};
