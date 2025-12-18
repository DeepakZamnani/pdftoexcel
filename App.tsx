
import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, Loader2, RefreshCcw, AlertCircle, CheckCircle2, ChevronRight, Layers, FileSearch, Sparkles } from 'lucide-react';
import { AppState } from './types';
import { extractInvoiceData } from './services/geminiService';
import { exportToExcel } from './utils/excelExport';

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<AppState>({
    file: null,
    filePreview: null,
    isReading: false,
    isProcessing: false,
    result: null,
    error: null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      
      if (!isPdf && !isImage) {
        setState(prev => ({ ...prev, error: "Please upload a PDF or an image file (PNG, JPG)." }));
        return;
      }

      setState(prev => ({ ...prev, isReading: true, error: null }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setState({
          file,
          filePreview: reader.result as string,
          isReading: false,
          isProcessing: false,
          result: null,
          error: null,
        });
        // Clear input value so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.onerror = () => {
        setState(prev => ({ ...prev, isReading: false, error: "Failed to read file." }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!state.file) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await extractInvoiceData(state.file);
      setState(prev => ({ ...prev, result, isProcessing: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isProcessing: false }));
    }
  };

  const handleReset = () => {
    setState({
      file: null,
      filePreview: null,
      isReading: false,
      isProcessing: false,
      result: null,
      error: null,
    });
  };

  const handleExport = () => {
    if (state.result) {
      exportToExcel(state.result, `invoice_analysis_${Date.now()}.xlsx`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdff]">
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-center py-3">
       
          {state.result && (
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-slate-200 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {!state.file ? (
          <div className="max-w-3xl mx-auto mt-8 animate-in fade-in zoom-in-95 duration-700">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Extract data in seconds.</h2>
              <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto leading-relaxed">
                Our engine identifies complex tables and key fields across multiple pages with surgical accuracy.
              </p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <label className="relative bg-white p-16 rounded-[2.5rem] border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/10 transition-all duration-300 block cursor-pointer">
                <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
                  {state.isReading ? (
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                  ) : (
                    <Upload className="w-12 h-12 text-indigo-500" />
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800">
                    {state.isReading ? 'Reading file...' : 'Drop your invoice here'}
                  </h3>
                  <p className="text-slate-400 font-medium">Click to browse your PDF or Image files</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={handleFileChange} 
                  accept=".pdf,image/*" 
                />
              </label>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: FileSearch, title: 'Multi-Page', desc: 'Seamlessly handles documents spanning dozens of pages.' },
                { icon: Layers, title: 'Complex Tables', desc: 'Identifies nested tables, tax breakdowns, and line items.' },
                { icon: CheckCircle2, title: 'Excel Ready', desc: 'Directly converts your data into clean, formatted Excel sheets.' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-4 text-indigo-600">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-slate-800 mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-full items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Sidebar: Status & Preview */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden group">
                <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/40">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                    Source File
                  </span>
                  <button onClick={handleReset} className="text-slate-400 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-xl">
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-8 flex items-center justify-center bg-white min-h-[300px]">
                  {state.file?.type === 'application/pdf' ? (
                    <div className="text-center group-hover:scale-105 transition-transform duration-500">
                      <div className="w-28 h-36 bg-indigo-50/50 rounded-2xl border-2 border-indigo-100 shadow-inner flex items-center justify-center mx-auto mb-4 relative">
                         <FileText className="w-14 h-14 text-indigo-300" />
                         <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-lg">PDF</div>
                      </div>
                      <p className="text-sm font-black text-slate-800 truncate max-w-[220px] mb-1">{state.file.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Ready for analysis</p>
                    </div>
                  ) : (
                    <div className="relative group-hover:scale-105 transition-transform duration-500">
                      <img src={state.filePreview!} alt="Preview" className="max-h-[450px] w-auto rounded-2xl shadow-2xl border border-slate-100" />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded-md">IMAGE</div>
                    </div>
                  )}
                </div>
              </div>

              {!state.result && !state.isProcessing && (
                <button
                  onClick={handleProcess}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center space-x-4 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span>ANALYZE NOW</span>
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </button>
              )}

              {state.isProcessing && (
                <div className="bg-slate-900 p-10 rounded-[2rem] text-center space-y-6 shadow-2xl shadow-slate-200">
                  <div className="relative w-20 h-20 mx-auto">
                    <Loader2 className="w-20 h-20 text-indigo-400 animate-spin absolute inset-0 opacity-20" />
                    <Loader2 className="w-20 h-20 text-white animate-spin absolute inset-0" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
                    <Sparkles className="w-8 h-8 text-amber-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-2xl text-white tracking-tight">AI Thinking...</h3>
                    <p className="text-indigo-200/60 font-medium text-sm">Our neural networks are mapping out tables and key identifiers across your pages.</p>
                  </div>
                </div>
              )}

              {state.error && (
                <div className="bg-white border border-red-100 p-6 rounded-[2rem] shadow-xl shadow-red-50 flex items-start space-x-4">
                  <div className="bg-red-50 p-2 rounded-xl">
                    <AlertCircle className="text-red-500 w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-red-900 text-lg leading-tight mb-1">Processing Failed</h4>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">{state.error}</p>
                    <button onClick={handleReset} className="w-full bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-red-600 transition-all uppercase tracking-widest shadow-lg shadow-red-100">
                      Start Over
                    </button>
                  </div>
                </div>
              )}

              {state.result && (
                <div className="bg-white border border-emerald-100 p-6 rounded-[2rem] shadow-xl shadow-emerald-50 flex items-center space-x-4">
                  <div className="bg-emerald-500 rounded-2xl p-3 shadow-lg shadow-emerald-100">
                    <CheckCircle2 className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-emerald-900 text-lg leading-tight">Extraction Ready</h4>
                    <p className="text-sm text-emerald-600 font-bold uppercase tracking-tighter">
                      {state.result.pages.length} {state.result.pages.length === 1 ? 'Page' : 'Pages'} Scanned
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content: Page-wise Results */}
            <div className="lg:col-span-8 space-y-16">
              {state.result ? (
                state.result.pages.map((page, pIdx) => (
                  <div key={pIdx} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${pIdx * 150}ms` }}>
                    <div className="flex items-center space-x-6">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200"></div>
                      <div className="flex flex-col items-center">
                        <span className="bg-slate-900 text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
                          Page {page.pageNumber}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200"></div>
                    </div>

                    {/* Page Fields */}
                    {page.fields.length > 0 && (
                      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                            <Layers className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                            Key Metadata
                          </h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                          {page.fields.map((field, fIdx) => (
                            <div key={fIdx} className="group">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 block group-hover:text-indigo-500 transition-colors">
                                {field.label}
                              </label>
                              <div className="text-slate-900 font-bold text-lg border-b-2 border-slate-50 pb-2 group-hover:border-indigo-100 transition-all break-words">
                                {field.value || <span className="text-slate-300">N/A</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Page Tables */}
                    {page.tables.map((table, tIdx) => (
                      <div key={tIdx} className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/30 border border-slate-100 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-50 bg-indigo-50/20 flex justify-between items-center">
                          <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3 animate-pulse"></span>
                            {table.tableName || `Detected Table ${tIdx + 1}`}
                          </h3>
                          <span className="text-[10px] font-black text-indigo-400 uppercase bg-indigo-50 px-3 py-1 rounded-full tracking-tighter">
                            {table.rows.length} Rows
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/30 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-50">
                              <tr>
                                {table.headers.map((h, hIdx) => (
                                  <th key={hIdx} className="px-8 py-5 whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {table.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors group">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-8 py-5 text-slate-700 font-bold group-hover:text-slate-950">{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                    
                    {page.fields.length === 0 && page.tables.length === 0 && (
                      <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileSearch className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No structural data on this page</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 h-full min-h-[600px] flex flex-col items-center justify-center text-slate-300 p-12 text-center group relative overflow-hidden">
                  <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-inner">
                      <FileSearch className="w-12 h-12 opacity-20" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Awaiting Analysis</h3>
                    <p className="max-w-xs text-slate-500 leading-relaxed font-medium mx-auto text-lg">
                      Upload your multi-page invoice and hit analyze to see the AI breakdown.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

 
    </div>
  );
};

export default App;
