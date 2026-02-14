
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PedagogicalSheet, SheetType, GenerationRequest } from '../types';
import { generatePedagogicalSheet } from '../services/geminiService';
import { SheetPreview } from './SheetPreview';

interface SheetEditorProps {
  sheets?: PedagogicalSheet[];
  onSave: (sheet: PedagogicalSheet) => void;
}

const SheetEditor: React.FC<SheetEditorProps> = ({ sheets = [], onSave }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  
  const [formData, setFormData] = useState<GenerationRequest & { type: SheetType }>({
    activity: '',
    gradeLevel: 'CM2',
    topic: '',
    languages: ['Français'],
    type: SheetType.LESSON
  });

  const [sheet, setSheet] = useState<PedagogicalSheet | null>(null);

  useEffect(() => {
    if (id) {
      const existing = sheets.find(s => s.id === id);
      if (existing) {
        setSheet(existing);
        setFormData({
          activity: existing.subject,
          gradeLevel: existing.gradeLevel,
          topic: existing.title,
          languages: ['Français'],
          type: existing.type
        });
      }
    }
  }, [id, sheets]);

  const toggleLanguage = (lang: string) => {
    setFormData(prev => {
      const current = prev.languages;
      if (current.includes(lang)) {
        if (current.length === 1) return prev;
        return { ...prev, languages: current.filter(l => l !== lang) };
      }
      return { ...prev, languages: [...current, lang] };
    });
  };

  const handleGenerate = async () => {
    if (!formData.activity || !formData.topic) {
      alert("Précisez l'activité et le titre pour interroger le guide.");
      return;
    }

    setLoading(true);
    try {
      const generated = await generatePedagogicalSheet(formData);
      setSheet({ ...generated, type: formData.type });
      setViewMode('preview');
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erreur de connexion au guide pédagogique IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (sheet) {
      onSave(sheet);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        navigate('/');
      }, 1500);
    }
  };

  const handlePrint = () => {
    if (viewMode === 'edit') {
        setViewMode('preview');
        setTimeout(() => window.print(), 500);
    } else {
        window.print();
    }
  };

  const exportToPDF = async () => {
    if (!sheet) return;
    if (viewMode === 'edit') {
      setViewMode('preview');
      setTimeout(() => triggerPdf(), 1000);
    } else {
      triggerPdf();
    }
  };

  const triggerPdf = async () => {
    if (!previewRef.current || !sheet) return;

    setPdfLoading(true);
    try {
      const element = previewRef.current.querySelector('.sheet-container');
      if (!element) throw new Error("Élément de la fiche non trouvé");

      const opt = {
        margin: 0,
        filename: `Fiche_CEB_${sheet.gradeLevel}_${sheet.title.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 3, 
          useCORS: true, 
          letterRendering: true,
          logging: false,
          width: 794,
          height: 1123,
          windowWidth: 794
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: 'avoid-all' }
      };

      const html2pdfLib = (window as any).html2pdf;
      if (typeof html2pdfLib === 'function') {
        await html2pdfLib().set(opt).from(element).toPdf().save();
      } else {
        throw new Error("html2pdf non disponible.");
      }
    } catch (err) {
      console.error(err);
      alert("Échec de l'export haute résolution. Utilisez l'impression système.");
    } finally {
      setPdfLoading(false);
    }
  };

  /**
   * Export function updated to generate a .docx compatible file
   * using MSO-specific headers and XML namespaces.
   */
  const exportToDocx = () => {
    if (!previewRef.current || !sheet) return;
    
    const content = previewRef.current.innerHTML;
    const orientation = 'portrait';
    
    // Constructing a robust HTML wrapper for Word .docx compatibility
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${sheet.title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 21cm 29.7cm;
            margin: 1cm 1cm 1cm 1cm;
            mso-page-orientation: ${orientation};
          }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 10pt; 
            line-height: 1.2;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 10pt;
            border: 1pt solid black;
          }
          th, td { 
            border: 1pt solid black; 
            padding: 5pt; 
            vertical-align: top;
          }
          .font-serif { font-family: "Times New Roman", serif; }
          .font-black { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .underline { text-decoration: underline; }
          .italic { font-style: italic; }
          .text-center { text-align: center; }
          .bg-slate-50, .bg-slate-100 { background-color: #f8fafc; }
          .text-indigo-600 { color: #4f46e5; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>`;

    // MIME type for DOCX
    const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const blob = new Blob(['\ufeff', header], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `Fiche_${sheet.gradeLevel}_${sheet.title.replace(/\s+/g, '_')}.docx`;
    link.click();
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const containsArabic = (text: string) => /[\u0600-\u06FF]/.test(text || '');
  const isArabic = sheet ? (containsArabic(sheet.title) || containsArabic(sheet.competence)) : false;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {saveSuccess && (
        <div className="fixed top-20 right-4 z-[100] bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-bounce">
          <i className="fas fa-check-circle text-xl"></i>
          <span className="font-bold">Fiche archivée !</span>
        </div>
      )}

      {pdfLoading && (
        <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center space-y-6 border-b-8 border-indigo-600">
            <div className="w-20 h-20 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="text-center">
               <p className="font-black text-slate-900 uppercase tracking-widest text-sm mb-2">Génération Monopage PDF</p>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Encapsulation des polices et centrage A4...</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="lg:w-[380px] no-print shrink-0">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl sticky top-24">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">Configuration</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">APC Sénégal</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                <i className="fas fa-book-open text-xl"></i>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Type de document</label>
                <div className="grid grid-cols-3 gap-2">
                   {[
                     { id: SheetType.LESSON, label: 'Leçon', icon: 'chalkboard' },
                     { id: SheetType.EXERCISE, label: 'TD/Exos', icon: 'file-pen' },
                     { id: SheetType.EVALUATION, label: 'Éval.', icon: 'award' }
                   ].map(type => (
                     <button 
                      key={type.id}
                      onClick={() => setFormData({...formData, type: type.id as SheetType})}
                      className={`flex flex-col items-center py-4 rounded-2xl border-2 transition-all ${formData.type === type.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-indigo-200'}`}
                     >
                       <i className={`fas fa-${type.icon} mb-2 text-lg`}></i>
                       <span className="text-[10px] font-black uppercase tracking-tight">{type.label}</span>
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest flex items-center">
                    <i className="fas fa-microscope mr-2 text-indigo-500"></i> Discipline / Activité
                  </label>
                  <input 
                    type="text"
                    placeholder="ex: Tawhid, Grammaire, Calcul..."
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none text-sm font-bold transition-all"
                    value={formData.activity}
                    onChange={e => setFormData({...formData, activity: e.target.value})}
                  />
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest flex items-center">
                    <i className="fas fa-heading mr-2 text-indigo-500"></i> Titre de la leçon
                  </label>
                  <input 
                    type="text"
                    placeholder="ex: Le futur simple..."
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none text-sm font-bold transition-all"
                    value={formData.topic}
                    onChange={e => setFormData({...formData, topic: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Classe</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none text-sm font-black"
                    value={formData.gradeLevel}
                    onChange={e => setFormData({...formData, gradeLevel: e.target.value})}
                  >
                    {['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Langues</label>
                  <div className="flex gap-1">
                     {['Français', 'Arabe', 'Anglais'].map(lang => (
                       <button 
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border-2 transition-all ${formData.languages.includes(lang) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                        title={lang}
                       >
                         {lang[0]}
                       </button>
                     ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center justify-center space-x-3 shadow-2xl shadow-slate-200 uppercase tracking-widest text-[11px]"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Interrogation IA...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-sparkles text-sm"></i>
                    <span>Consulter le Guide IA</span>
                  </>
                )}
              </button>
            </div>

            {sheet && (
              <div className="mt-10 pt-8 border-t-2 border-slate-100 space-y-4">
                <button onClick={handleSave} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all flex items-center justify-center uppercase text-xs tracking-widest shadow-lg shadow-emerald-100">
                  <i className="fas fa-check-double mr-2"></i> Sauvegarder la Fiche
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handlePrint} className="py-4 bg-indigo-50 text-indigo-700 border-2 border-indigo-100 rounded-2xl font-black text-[10px] uppercase flex flex-col items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                    <i className="fas fa-print mb-1 block text-xl"></i> Imprimer
                  </button>
                  <button onClick={exportToPDF} className="py-4 bg-rose-50 text-rose-700 border-2 border-rose-100 rounded-2xl font-black text-[10px] uppercase flex flex-col items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                    <i className="fas fa-file-pdf mb-1 block text-xl"></i> PDF A4
                  </button>
                  <button onClick={exportToDocx} className="col-span-2 py-4 bg-blue-50 text-blue-700 border-2 border-blue-100 rounded-2xl font-black text-[10px] uppercase flex flex-row items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                    <i className="fas fa-file-word mr-2 text-xl"></i> Exporter en DOCX
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-grow overflow-hidden">
          {!sheet ? (
            <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-20 text-center flex flex-col items-center justify-center min-h-[800px] shadow-sm">
               <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8 border-4 border-white shadow-inner">
                <i className="fas fa-language text-5xl"></i>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-6">Prêt pour la déclinaison ?</h3>
              <p className="text-slate-400 max-w-sm font-bold text-lg">Sélectionnez vos paramètres pour générer une fiche conforme au guide pédagogique Sénégal.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex bg-slate-200/40 p-1 rounded-2xl no-print w-fit border border-slate-200">
                <button onClick={() => setViewMode('edit')} className={`px-8 py-3 rounded-xl text-[11px] font-black transition-all ${viewMode === 'edit' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}>Correction</button>
                <button onClick={() => setViewMode('preview')} className={`px-8 py-3 rounded-xl text-[11px] font-black transition-all ${viewMode === 'preview' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}>Aperçu Monopage</button>
              </div>
              
              <div className="bg-slate-200 rounded-[3rem] p-4 flex justify-center shadow-inner overflow-auto max-h-[900px]">
                {viewMode === 'edit' ? (
                  <div className="bg-white p-10 w-full rounded-[2.5rem] shadow-xl space-y-8" dir={isArabic ? 'rtl' : 'ltr'}>
                     <input 
                        className="text-3xl font-black text-slate-900 w-full border-b-4 border-slate-100 outline-none focus:text-indigo-600 bg-transparent py-2"
                        value={sheet.title}
                        onChange={e => setSheet({...sheet, title: e.target.value})}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <textarea className="p-6 bg-slate-50 rounded-[2rem] text-sm italic min-h-[120px] outline-none border-2 border-transparent focus:border-indigo-200" value={sheet.competence} onChange={e => setSheet({...sheet, competence: e.target.value})} />
                        <textarea className="p-6 bg-indigo-50/30 rounded-[2rem] text-sm font-bold min-h-[120px] outline-none border-2 border-transparent focus:border-indigo-400" value={sheet.specificObjective} onChange={e => setSheet({...sheet, specificObjective: e.target.value})} />
                      </div>
                      <div className="space-y-6">
                        {sheet.steps.map((step, idx) => (
                          <div key={idx} className="bg-white border-2 border-slate-100 p-6 rounded-[2rem]">
                            <input className="font-black text-indigo-600 uppercase w-full mb-4 outline-none" value={step.name} onChange={e => { const s = [...sheet.steps]; s[idx].name = e.target.value; setSheet({...sheet, steps: s}); }} />
                            <div className="grid grid-cols-2 gap-4">
                              <textarea className="bg-slate-50 rounded-xl p-3 text-xs min-h-[100px] outline-none" value={step.teacherActivity} onChange={e => { const s = [...sheet.steps]; s[idx].teacherActivity = e.target.value; setSheet({...sheet, steps: s}); }} />
                              <textarea className="bg-slate-50 rounded-xl p-3 text-xs min-h-[100px] outline-none" value={step.studentActivity} onChange={e => { const s = [...sheet.steps]; s[idx].studentActivity = e.target.value; setSheet({...sheet, steps: s}); }} />
                            </div>
                          </div>
                        ))}
                      </div>
                  </div>
                ) : (
                  <div ref={previewRef} className="print:m-0">
                    <SheetPreview sheet={sheet} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SheetEditor;
