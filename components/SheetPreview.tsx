import React from 'react';
import { PedagogicalSheet, SheetType } from '../types';

interface SheetPreviewProps {
  sheet: PedagogicalSheet;
}

export const SheetPreview: React.FC<SheetPreviewProps> = ({ sheet }) => {
  const containsArabic = (text: string) => /[\u0600-\u06FF]/.test(text || '');
  const isArabic = containsArabic(sheet.title) || containsArabic(sheet.cb);
  const dir = isArabic ? 'rtl' : 'ltr';
  const textAlign = isArabic ? 'text-right' : 'text-left';

  const renderBilingualText = (text: string) => {
    if (!text || !text.includes(' / ')) return text;
    const parts = text.split(' / ');
    return (
      <>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            <span className={containsArabic(part) ? 'font-serif font-bold text-[1.1em]' : ''}>{part}</span>
            {i < parts.length - 1 && <span className="text-indigo-400 print:text-black font-black px-1">/</span>}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <div 
      className="sheet-container bg-white text-slate-900 flex flex-col mx-auto shadow-2xl print:shadow-none" 
      style={{ 
        width: '210mm', 
        height: '297mm', 
        padding: '10mm',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }} 
      dir={dir}
    >
      {/* En-tête Institutionnel */}
      <div className={`flex justify-between items-start border-b-2 border-slate-950 pb-2 mb-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div className={`text-[8px] font-bold uppercase space-y-0.5 ${textAlign} w-1/3`}>
          <p>République du Sénégal</p>
          <p className="text-indigo-700 print:text-black italic">Un Peuple - Un But - Une Foi</p>
          <p>Ministère de l'Éducation Nationale</p>
          <p>Inspection de l'Éducation et de la Formation</p>
        </div>
        <div className="text-center w-1/3">
          <div className="inline-block border-[1.5pt] border-slate-950 px-3 py-1 mb-1">
            <h1 className="text-[14px] font-black uppercase leading-none tracking-tighter">FICHE PÉDAGOGIQUE</h1>
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600 print:text-black">Guide CEB - APC</p>
        </div>
        <div className={`text-[8px] font-bold uppercase space-y-1 ${isArabic ? 'text-left' : 'text-right'} w-1/3`}>
          <p className="text-[10px] font-black bg-slate-900 text-white print:bg-slate-200 print:text-black px-1.5 py-0.5 inline-block rounded-sm">Classe : {sheet.gradeLevel}</p>
          <p>Date : <span className="font-medium">{new Date(sheet.createdAt).toLocaleDateString('fr-FR')}</span></p>
          <p>Effectif : ....... G: .... F: ....</p>
        </div>
      </div>

      {/* Cadre Curriculaire - Recipe 1 Inspired Grid */}
      <div className="mb-3 space-y-1">
        <div className={`grid grid-cols-2 border-[1.5pt] border-slate-950 p-2 bg-slate-50/50 print:bg-transparent ${textAlign} text-[9px] gap-x-4 gap-y-1`}>
          <div className="flex items-baseline gap-2"><span className="font-black text-[8px] opacity-70">DOMAINE :</span> <span className="uppercase font-bold">{renderBilingualText(sheet.domain)}</span></div>
          <div className="flex items-baseline gap-2"><span className="font-black text-[8px] opacity-70">S-DOMAINE :</span> <span className="uppercase font-bold">{renderBilingualText(sheet.subDomain)}</span></div>
          <div className="flex items-baseline gap-2"><span className="font-black text-[8px] opacity-70">DISCIPLINE :</span> <span className="uppercase font-bold">{renderBilingualText(sheet.discipline || '/')}</span></div>
          <div className="flex items-baseline gap-2"><span className="font-black text-[8px] opacity-70">ACTIVITÉ :</span> <span className="uppercase font-bold">{renderBilingualText(sheet.subject)}</span></div>
        </div>
        
        <div className={`p-2.5 border-[1.5pt] border-slate-950 border-t-0 ${textAlign} space-y-1.5`}>
          <div className="flex items-start gap-2">
            <span className="font-black text-[9px] uppercase tracking-tighter bg-indigo-600 text-white print:bg-slate-200 print:text-black px-1.5 leading-tight rounded-sm">TITRE :</span>
            <span className="font-black text-[10px] uppercase underline decoration-2 underline-offset-2 leading-tight">{renderBilingualText(sheet.title)}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 text-[8.5px] leading-tight">
            <div>
              <span className="font-black uppercase text-indigo-700 print:text-black">CB :</span> 
              <span className="ml-1 italic font-medium">{renderBilingualText(sheet.cb)}</span>
            </div>
            <div>
              <span className="font-black uppercase text-indigo-700 print:text-black">Palier :</span> 
              <span className="ml-1 italic font-medium">{renderBilingualText(sheet.palier)}</span>
            </div>
          </div>

          <div className="text-[8.5px] leading-snug">
            <span className="font-black uppercase text-indigo-700 print:text-black">OA :</span> 
            <span className="ml-1 italic font-medium">{renderBilingualText(sheet.oa)}</span>
          </div>

          <div className="bg-slate-100/50 print:bg-slate-50 p-2 border-l-4 border-indigo-600 print:border-slate-950">
            <span className="font-black uppercase text-[8.5px]">Objectif Spécifique (OS) :</span>
            <p className="font-bold text-[9px] leading-tight italic text-slate-800">{renderBilingualText(sheet.os)}</p>
          </div>
        </div>
      </div>

      {/* Intrants - Horizontal Row */}
      <div className={`grid grid-cols-4 gap-0 text-[8px] border-[1.5pt] border-slate-950 border-t-0 mb-3 bg-white ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div className="border-r-[1.5pt] border-slate-950 p-1.5 text-center"><span className="block text-[6.5px] font-black uppercase opacity-60 mb-0.5">Durée</span><span className="font-black text-indigo-700 print:text-black">{sheet.duration}</span></div>
        <div className="border-r-[1.5pt] border-slate-950 p-1.5 text-center col-span-2"><span className="block text-[6.5px] font-black uppercase opacity-60 mb-0.5">Supports / Matériel</span><span className="truncate block italic font-medium">{renderBilingualText(sheet.material?.collective || 'Tableau, Craies, Guide')}</span></div>
        <div className="p-1.5 text-center"><span className="block text-[6.5px] font-black uppercase opacity-60 mb-0.5">Référence</span><span className="truncate block font-bold text-slate-700">{renderBilingualText(sheet.reference || 'Guide CEB')}</span></div>
      </div>

      {/* SECTION CRITIQUE : TRACE ÉCRITE / RÉSUMÉ */}
      <div className={`mb-3 border-[1.5pt] border-slate-950 p-3 bg-indigo-50/20 print:bg-transparent ${textAlign} relative overflow-hidden`}>
        <div className="flex items-center mb-1.5 border-b border-slate-300 pb-1">
          <i className="fas fa-feather-pointed text-[9px] mr-2 text-indigo-500 print:hidden"></i>
          <span className="font-black uppercase text-[10px] tracking-widest text-indigo-900 print:text-black">
            {sheet.type === SheetType.EVALUATION ? "Situation d'Évaluation" : "Contenu (Trace Écrite)"}
          </span>
        </div>
        <div className="text-[10px] md:text-[10.5px] leading-relaxed font-medium whitespace-pre-wrap italic text-slate-800">
          {renderBilingualText(sheet.contenu)}
        </div>
      </div>

      {/* Tableau de Déroulement */}
      <div className="flex-grow overflow-hidden flex flex-col min-h-0">
        <table className="w-full border-collapse border-[1.5pt] border-slate-950 table-fixed">
          <thead>
            <tr className="bg-slate-900 text-white print:bg-slate-100 print:text-black font-black uppercase text-[7.5px] leading-tight">
              <th className="py-1.5 px-1 w-[12%] border-r-[1.5pt] border-slate-950 text-center">
                {sheet.type === SheetType.EVALUATION ? "N° / Barème" : "Étapes"}
              </th>
              <th className="py-1.5 px-1 w-[15%] border-r-[1.5pt] border-slate-950 text-center">
                {sheet.type === SheetType.EVALUATION ? "Compétence" : "Objectifs"}
              </th>
              <th className="py-1.5 px-1.5 w-[36.5%] border-r-[1.5pt] border-slate-950 text-left">
                {sheet.type === SheetType.EVALUATION ? "Items (Énoncés)" : "Activités du Maitre"}
              </th>
              <th className="py-1.5 px-1.5 w-[36.5%] text-left">
                {sheet.type === SheetType.EVALUATION ? "Réponses Attendues" : "Activités des Élèves"}
              </th>
            </tr>
          </thead>
          <tbody className="text-[8.5px] leading-tight font-medium">
            {sheet.steps.slice(0, 5).map((step, idx) => (
              <tr key={idx} className="align-top border-b border-slate-300 last:border-b-0">
                <td className={`p-1.5 font-bold uppercase text-[7.5px] bg-slate-50 print:bg-transparent border-r-[1.5pt] border-slate-950 ${textAlign} break-words`}>
                  {renderBilingualText(step.name)}
                </td>
                <td className={`p-1.5 text-[7.5px] italic border-r-[1.5pt] border-slate-950 ${textAlign} break-words text-slate-600`}>
                  {renderBilingualText(step.objective)}
                </td>
                <td className={`p-2 border-r-[1.5pt] border-slate-950 text-justify ${textAlign} break-words`}>
                  {renderBilingualText(step.teacherActivity)}
                </td>
                <td className={`p-2 text-justify ${textAlign} break-words`}>
                  {renderBilingualText(step.studentActivity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Observations */}
      <div className="mt-3 border-[1.5pt] border-slate-950 p-2 text-[7.5px] h-10 relative bg-slate-50/30 print:bg-transparent">
        <span className="font-black uppercase bg-white print:bg-white px-1.5 absolute -top-2 left-3 border border-slate-950">Observations :</span>
      </div>

      {/* Signatures */}
      <div className={`mt-4 grid grid-cols-2 gap-12 px-10 text-[9px] font-black uppercase text-center ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div className="flex flex-col items-center">
          <p className="underline underline-offset-4 decoration-1">L'Enseignant</p>
          <div className="h-6"></div>
        </div>
        <div className="flex flex-col items-center">
          <p className="underline underline-offset-4 decoration-1">Direction de l'École</p>
          <div className="h-6"></div>
        </div>
      </div>

      <footer className="mt-auto pt-2 text-center text-[7px] text-slate-400 font-bold uppercase tracking-[0.2em] border-t border-slate-100">
        Kabo FichesGen v2.5 • APC Sénégal • Conçu pour l'excellence pédagogique
      </footer>
    </div>
  );
};