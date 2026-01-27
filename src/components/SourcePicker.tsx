import React, { useCallback } from 'react';
import { FolderOpen, FileJson, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface FileInfo {
    file: File;
    name: string;
    isAvailable: boolean;
    content?: any;
}

interface SourcePickerProps {
    onFilesSelected: (files: FileInfo[]) => void;
    files: FileInfo[];
    onContinue: () => void;
}

export const SourcePicker: React.FC<SourcePickerProps> = ({ onFilesSelected, files, onContinue }) => {
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFiles = e.target.files;
        if (!rawFiles) return;

        const fileList = Array.from(rawFiles);
        const processedFiles: FileInfo[] = await Promise.all(
            fileList.map(async (file) => {
                try {
                    const text = await file.text();
                    const content = JSON.parse(text);
                    return { file, name: file.name, isAvailable: true, content };
                } catch (err) {
                    return { file, name: file.name, isAvailable: false };
                }
            })
        );

        onFilesSelected(processedFiles);
    }, [onFilesSelected]);

    const successCount = files.filter(f => f.isAvailable).length;
    const failCount = files.length - successCount;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel container"
            style={{ padding: '3rem', textAlign: 'center' }}
        >
            <div style={{ marginBottom: '2rem' }}>
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
                    <UploadCloud size={40} />
                </div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Trip Schema Exporter</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Select a folder containing multiple Tour JSON files or a single JSON to get started.
                    Everything stays in your browser.
                </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                <label className="btn-primary" style={{ cursor: 'pointer' }}>
                    <FolderOpen size={20} />
                    Select Folder
                    <input
                        type="file"
                        style={{ display: 'none' }}
                        multiple
                        // @ts-ignore
                        webkitdirectory=""
                        directory=""
                        onChange={handleFileChange}
                    />
                </label>

                <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                    <FileJson size={20} />
                    Select JSON Files
                    <input
                        type="file"
                        style={{ display: 'none' }}
                        multiple
                        accept=".json"
                        onChange={handleFileChange}
                    />
                </label>
            </div>

            {files.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Files</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{files.length}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'var(--success-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle2 size={16} /> Parsable
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{successCount}</div>
                        </div>
                        {failCount > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: 'var(--error-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertCircle size={16} /> Failed
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{failCount}</div>
                            </div>
                        )}
                    </div>

                    <button
                        className="btn-primary"
                        style={{ marginTop: '2.5rem', padding: '16px 48px', fontSize: '1.2rem' }}
                        disabled={successCount === 0}
                        onClick={onContinue}
                    >
                        Continue to Field Selection
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
};
