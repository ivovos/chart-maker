import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Settings2, Download, Moon, Sun, Plus, Trash2, RotateCcw, FileInput, Type } from 'lucide-react';
import html2canvas from 'html2canvas';
import { parseCSV } from './utils/csvParser';
import { generateScale } from './utils/colorGenerator';
import BubbleChart from './components/BubbleChart';
import { DataPoint } from './types';

// Default Data (used if LocalStorage is empty)
const DEFAULT_LABELS = { title1: 'People (%)', title2: 'Est. Market Value (%)' };
const DEFAULT_DATA: DataPoint[] = [
  { category: 'General sightseeing in Standard and Standard Premier', metric1: 25, metric2: 21 },
  { category: 'Visiting friends or family in Standard and Standard Premier', metric1: 14, metric2: 12 },
  { category: 'Romantic / special occasion in Standard and Standard Premier', metric1: 8, metric2: 7 },
  { category: 'Business in Business Premier', metric1: 9, metric2: 18 },
];

const DEFAULT_COLOR_1 = '#E5DDFF'; // Light lavender
const DEFAULT_COLOR_2 = '#4F5870'; // Slate

type NoteMode = 'shared' | 'individual';

function App() {
  // State
  const [labels, setLabels] = useState(DEFAULT_LABELS);
  const [data, setData] = useState<DataPoint[]>(DEFAULT_DATA);
  const [color1, setColor1] = useState(DEFAULT_COLOR_1);
  const [color2, setColor2] = useState(DEFAULT_COLOR_2);
  const [darkMode, setDarkMode] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  // Annotation State
  const [noteMode, setNoteMode] = useState<NoteMode>('shared');
  const [sharedNote, setSharedNote] = useState('');
  const [note1, setNote1] = useState('');
  const [note2, setNote2] = useState('');
  
  const chartRef = useRef<HTMLDivElement>(null);

  // 1. Initialize from LocalStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('brandChartConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.labels) setLabels(parsed.labels);
        if (parsed.data) setData(parsed.data);
        if (parsed.color1) setColor1(parsed.color1);
        if (parsed.color2) setColor2(parsed.color2);
        if (parsed.darkMode !== undefined) setDarkMode(parsed.darkMode);
        if (parsed.noteMode) setNoteMode(parsed.noteMode);
        if (parsed.sharedNote !== undefined) setSharedNote(parsed.sharedNote);
        if (parsed.note1 !== undefined) setNote1(parsed.note1);
        if (parsed.note2 !== undefined) setNote2(parsed.note2);
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }
  }, []);

  // 2. Save to LocalStorage on Change
  useEffect(() => {
    localStorage.setItem('brandChartConfig', JSON.stringify({
      labels,
      data,
      color1,
      color2,
      darkMode,
      noteMode,
      sharedNote,
      note1,
      note2
    }));
  }, [labels, data, color1, color2, darkMode, noteMode, sharedNote, note1, note2]);

  // Toggle Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Derived Colors
  const palette1 = useMemo(() => generateScale(color1, 5).reverse(), [color1]);
  const palette2 = useMemo(() => generateScale(color2, 5), [color2]);

  // Handlers
  const handleDownload = async () => {
    if (chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: darkMode ? '#111827' : '#ffffff',
          scale: 2, // Higher resolution for better quality
        });
        
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `chart-export-${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export image. See console for details.');
      }
    }
  };

  const handleDataChange = (index: number, field: keyof DataPoint, value: string | number) => {
    const newData = [...data];
    if (field === 'category') {
      newData[index] = { ...newData[index], [field]: value };
    } else {
      newData[index] = { ...newData[index], [field]: Number(value) };
    }
    setData(newData);
  };

  const addRow = () => {
    setData([...data, { category: 'New Category', metric1: 10, metric2: 10 }]);
  };

  const removeRow = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    setData(newData);
  };

  const handleImport = () => {
    const parsed = parseCSV(importText);
    setLabels({ title1: parsed.title1, title2: parsed.title2 });
    setData(parsed.data);
    setShowImport(false);
    setImportText('');
  };

  const resetDefaults = () => {
    if (confirm("Reset all data to defaults?")) {
      setLabels(DEFAULT_LABELS);
      setData(DEFAULT_DATA);
      setColor1(DEFAULT_COLOR_1);
      setColor2(DEFAULT_COLOR_2);
      setNoteMode('shared');
      setSharedNote('');
      setNote1('');
      setNote2('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-indigo-500 to-purple-500" />
          <h1 className="text-lg font-bold tracking-tight">ChartGen</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={handleDownload}
            className="hidden sm:flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Download size={16} />
            Export PNG
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel: Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6 max-h-[calc(100vh-100px)] lg:overflow-y-auto pr-1 custom-scrollbar">
          
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <Settings2 size={18} />
                <h2>Configuration</h2>
              </div>
              <button onClick={resetDefaults} className="text-xs text-red-400 hover:text-red-500" title="Reset to defaults">
                <RotateCcw size={14}/>
              </button>
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Primary Tone</label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                  <input 
                    type="color" 
                    value={color1}
                    onChange={(e) => setColor1(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">{color1}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Secondary Tone</label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                  <input 
                    type="color" 
                    value={color2}
                    onChange={(e) => setColor2(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">{color2}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 my-4"></div>

            {/* Labels Input */}
            <div className="mb-6">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Metric Labels</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input 
                    type="text" 
                    value={labels.title1}
                    onChange={(e) => setLabels({...labels, title1: e.target.value})}
                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Metric 1 Name"
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    value={labels.title2}
                    onChange={(e) => setLabels({...labels, title2: e.target.value})}
                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Metric 2 Name"
                  />
                </div>
              </div>
            </div>

            {/* Data Fields */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data Points</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowImport(!showImport)}
                    className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                  >
                   <FileInput size={12} /> {showImport ? 'Cancel Import' : 'Import CSV'}
                  </button>
                </div>
              </div>

              {showImport ? (
                <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <textarea
                    className="w-full h-32 p-3 mb-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-mono outline-none resize-none"
                    placeholder="Paste CSV here (Category, Value1, Value2)..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />
                  <button 
                    onClick={handleImport}
                    disabled={!importText.trim()}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Load Data
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center group">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={row.category}
                          onChange={(e) => handleDataChange(idx, 'category', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Category"
                        />
                      </div>
                      <div className="w-16">
                        <input 
                          type="number" 
                          value={row.metric1}
                          onChange={(e) => handleDataChange(idx, 'metric1', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="0"
                        />
                      </div>
                      <div className="w-16">
                        <input 
                          type="number" 
                          value={row.metric2}
                          onChange={(e) => handleDataChange(idx, 'metric2', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="0"
                        />
                      </div>
                      <button 
                        onClick={() => removeRow(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Remove row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    onClick={addRow}
                    className="mt-2 flex items-center justify-center gap-1 w-full py-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                  >
                    <Plus size={14} /> Add Data Point
                  </button>
                </div>
              )}
            </div>

            {/* Annotations */}
            <div className="border-t border-gray-100 dark:border-gray-800 my-4"></div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                 <Type size={14} className="text-gray-400"/>
                 <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Annotations</h3>
              </div>
              
              {/* Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-4">
                <button 
                  onClick={() => setNoteMode('shared')} 
                  className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${noteMode === 'shared' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Unified Note
                </button>
                <button 
                  onClick={() => setNoteMode('individual')} 
                  className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${noteMode === 'individual' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Split Notes
                </button>
              </div>

              {/* Note Inputs */}
              {noteMode === 'shared' ? (
                <div>
                   <textarea 
                     value={sharedNote} 
                     onChange={(e) => setSharedNote(e.target.value)} 
                     placeholder="Enter a caption that appears centered below both charts..." 
                     className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-y" 
                   />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 ml-1">Below {labels.title1 || 'Chart 1'}</label>
                    <textarea 
                      value={note1} 
                      onChange={(e) => setNote1(e.target.value)} 
                      placeholder="Note for left chart..." 
                      className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] resize-y" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 ml-1">Below {labels.title2 || 'Chart 2'}</label>
                    <textarea 
                      value={note2} 
                      onChange={(e) => setNote2(e.target.value)} 
                      placeholder="Note for right chart..." 
                      className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] resize-y" 
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Panel: Visualization */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Charts Box - Targeted for Export */}
          <div ref={chartRef} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 flex flex-col items-center justify-center min-h-[400px]">
            {data.length === 0 ? (
              <div className="text-center text-gray-400 flex flex-col items-center">
                <p className="mb-4">No data available.</p>
                <button onClick={resetDefaults} className="text-indigo-500 hover:underline">Load Example Data</button>
              </div>
            ) : (
              <div className="flex flex-col w-full">
                
                {/* Main Grid for Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start w-full">
                  
                  {/* Chart 1 */}
                  <div className="flex flex-col items-center w-full gap-4">
                    <BubbleChart 
                      data={data.map(d => ({ name: d.category, value: d.metric1 }))}
                      colors={palette1}
                      metricLabel={labels.title1}
                      width={350}
                      height={350}
                      textColor="#ffffff" // White text
                    />
                    {noteMode === 'individual' && note1 && (
                      <p className="text-center text-sm text-gray-600 dark:text-gray-400 max-w-[300px] whitespace-pre-wrap">{note1}</p>
                    )}
                  </div>

                  {/* Chart 2 */}
                  <div className="flex flex-col items-center w-full gap-4">
                    <BubbleChart 
                      data={data.map(d => ({ name: d.category, value: d.metric2 }))}
                      colors={palette2}
                      metricLabel={labels.title2}
                      width={350}
                      height={350}
                      textColor="#ffffff" // White text
                    />
                    {noteMode === 'individual' && note2 && (
                       <p className="text-center text-sm text-gray-600 dark:text-gray-400 max-w-[300px] whitespace-pre-wrap">{note2}</p>
                    )}
                  </div>
                </div>

                {/* Shared Unified Note */}
                {noteMode === 'shared' && sharedNote && (
                  <div className="w-full mt-8 flex justify-center">
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400 max-w-2xl whitespace-pre-wrap">{sharedNote}</p>
                  </div>
                )}
                
              </div>
            )}
          </div>

          {/* Insights Box */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
             <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Insights</h3>
             {data.length === 0 ? (
                <p className="text-sm text-gray-500">No data loaded.</p>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {data.map((item, idx) => (
                   <div key={idx} className="flex items-center justify-between text-sm group bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                      <div className="flex items-center gap-3 truncate pr-2">
                         <div 
                           className="w-3 h-3 rounded-full flex-shrink-0" 
                           style={{ backgroundColor: palette1[idx % palette1.length] }} 
                         />
                         <span className="text-gray-600 dark:text-gray-300 truncate font-medium">{item.category}</span>
                      </div>
                      <div className="flex gap-2 text-gray-500 font-mono text-xs flex-shrink-0">
                         <span title={labels.title1}>{item.metric1}%</span>
                         <span className="text-gray-300 dark:text-gray-600">|</span>
                         <span title={labels.title2} style={{ color: palette2[idx % palette2.length] }}>{item.metric2}%</span>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>

        </div>

      </main>
    </div>
  );
}

export default App;