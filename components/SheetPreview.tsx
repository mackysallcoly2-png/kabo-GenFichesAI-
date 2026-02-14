
import React from 'react';
import { PedagogicalSheet } from '../types';

interface SheetPreviewProps {
  sheet: PedagogicalSheet;
}

export const SheetPreview: React.FC<SheetPreviewProps> = ({ sheet }) => {
  const containsArabic = (text: string) => /[\u0600-\u06FF]/.test(text || '');
  const isArabic = containsArabic(sheet.title) || containsArabic(sheet.competence);
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
      className="sheet-container bg-white p-8 print:p-0 text-slate-900 flex flex-col mx-auto" 
      style={{ 
        width: '210mm', 
        height: '297mm', 
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }} 
      dir={dir}
    >
      {/* En-tête Institutionnel - Très compact pour préserver de l'espace */}
      <div className={`flex justify-between items-center border-b-2 border-black pb-1 mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div className={`text-[7px] font-bold uppercase space-y-0.5 ${textAlign} w-1/3`}>
          <p>République du Sénégal</p>
          <p>Ministère de l'Éducation Nationale</p>
          <p>IEF : ...............................................</p>
          <p>École : ............................................</p>
        </div>
        <div className="text-center w-1/3">
          <div className="inline-block border-2 border-black px-1.5 py-0.5 mb-0.5">
            <h1 className="text-[12px] font-black uppercase leading-none">FICHE DE PRÉPARATION</h1>
          </div>
          <p className="text-[8px] font-black uppercase tracking-widest text-indigo-600 print:text-black">Guide CEB - APC</p>
        </div>
        <div className={`text-[7px] font-bold uppercase space-y-0.5 ${isArabic ? 'text-left' : 'text-right'} w-1/3`}>
          <p className="text-[9px] font-black">Classe : {sheet.gradeLevel}</p>
          <p>Effectif : ....... G: .... F: ....</p>
          <p>Date : {new Date(sheet.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      {/* Cadre Curriculaire - Gestion dynamique de l'espace */}
      <div className="mb-2 space-y-0.5">
        <div className={`grid grid-cols-2 border-2 border-black p-1.5 bg-slate-50 print:bg-white ${textAlign} text-[8.5px] gap-x-2`}>
          <div className="truncate"><span className="font-black">DOMAINE :</span> <span className="uppercase">{renderBilingualText(sheet.domain)}</span></div>
          <div className="truncate"><span className="font-black">S-DOMAINE :</span> <span className="uppercase">{renderBilingualText(sheet.subDomain)}</span></div>
          <div className="truncate"><span className="font-black">DISCIPLINE :</span> <span className="uppercase">{renderBilingualText(sheet.discipline || '/')}</span></div>
          <div className="truncate"><span className="font-black">ACTIVITÉ :</span> <span className="uppercase">{renderBilingualText(sheet.subject)}</span></div>
        </div>
        
        <div className={`p-2 border-2 border-black border-t-0 ${textAlign} space-y-1.5`}>
          <div className="flex items-start gap-1.5">
            <span className="font-black text-[9px] uppercase whitespace-nowrap bg-black text-white px-1 leading-tight">TITRE :</span>
            <span className="font-black text-[10.5px] uppercase underline decoration-1 underline-offset-1 leading-tight">{renderBilingualText(sheet.title)}</span>
          </div>
          
          <div className="text-[8.5px] leading-snug">
            <span className="font-black uppercase text-indigo-700 print:text-black">CB :</span> 
            <span className="ml-1 italic">{renderBilingualText(sheet.competence)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[8px]">
            <div className="bg-slate-50 print:bg-transparent p-1 border border-black/10 print:border-black">
              <span className="font-black uppercase block border-b border-black/10 mb-0.5">Palier :</span>
              <span className="line-clamp-1">{renderBilingualText(sheet.level)}</span>
            </div>
            <div className="bg-slate-50 print:bg-transparent p-1 border border-black/10 print:border-black">
              <span className="font-black uppercase block border-b border-black/10 mb-0.5">OA :</span>
              <span className="line-clamp-1">{renderBilingualText(sheet.oa)}</span>
            </div>
          </div>

          <div className="bg-slate-100 print:bg-slate-50 p-1.5 border-l-4 border-black">
            <span className="font-black uppercase text-[8.5px]">Objectif Spécifique (OS) :</span>
            <p className="font-bold text-[9px] leading-tight italic">{renderBilingualText(sheet.specificObjective)}</p>
          </div>
        </div>
      </div>

      {/* Intrants - Unifiée en une ligne */}
      <div className={`grid grid-cols-4 gap-0 text-[8px] border-2 border-black border-t-0 mb-2 bg-white ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div className="border-r-2 border-black p-1 text-center"><span className="block text-[6px] uppercase">Durée</span><span className="font-black">{sheet.duration}</span></div>
        <div className="border-r-2 border-black p-1 text-center col-span-2"><span className="block text-[6px] uppercase">Supports / Matériel</span><span className="truncate block italic">{renderBilingualText(sheet.material?.collective || 'Tableau, Craies')}</span></div>
        <div className="p-1 text-center"><span className="block text-[6px] uppercase">Référence</span><span className="truncate block font-bold">{renderBilingualText(sheet.reference || 'Guide CEB')}</span></div>
      </div>

      {/* Tableau de Déroulement - Occupation Optimisée */}
      <div className="flex-grow overflow-hidden flex flex-col">
        <table className="w-full border-collapse border-2 border-black table-fixed flex-grow">
          <thead>
            <tr className="bg-slate-900 text-white print:bg-slate-200 print:text-black font-black uppercase text-[7px] leading-tight">
              <th className="p-1 w-[12%] border-r-2 border-black text-center">Étapes</th>
              <th className="p-1 w-[15%] border-r-2 border-black text-center">Objectifs</th>
              <th className="p-1 w-[36.5%] border-r-2 border-black">Maitre</th>
              <th className="p-1 w-[36.5%]">Élèves</th>
            </tr>
          </thead>
          <tbody className="text-[8.5px] leading-[1.1] font-medium">
            {sheet.steps.slice(0, 5).map((step, idx) => (
              <tr key={idx} className="align-top border-b border-black">
                <td className={`p-1 font-black uppercase text-[7.5px] bg-slate-50 print:bg-transparent border-r-2 border-black ${textAlign} break-words`}>
                  {renderBilingualText(step.name)}
                </td>
                <td className={`p-1 text-[7.5px] italic border-r-2 border-black ${textAlign} break-words`}>
                  {renderBilingualText(step.objective)}
                </td>
                <td className={`p-1.5 border-r-2 border-black text-justify ${textAlign} break-words`}>
                  {renderBilingualText(step.teacherActivity)}
                </td>
                <td className={`p-1.5 text-justify ${textAlign} break-words`}>
                  {renderBilingualText(step.studentActivity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Observations - Pied de page */}
      <div className="mt-1.5 border-2 border-black p-1.5 text-[7px] h-10 relative">
        <span className="font-black uppercase bg-white px-1 absolute -top-1.5 left-2">Observations :</span>
        <div className="mt-1 border-b border-black/10 w-full h-2"></div>
      </div>

      {/* Signatures - Format compact */}
      <div className={`mt-2 grid grid-cols-2 gap-10 px-8 text-[8px] font-black uppercase text-center ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div className="space-y-4">
          <p className="underline underline-offset-2">L'Enseignant</p>
          <div className="h-4"></div>
        </div>
        <div className="space-y-4">
          <p className="underline underline-offset-2">Direction / IEF</p>
          <div className="h-4"></div>
        </div>
      </div>

      <footer className="mt-auto pt-1 text-center text-[6px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-100">
        Kabo FichesGen v2.5 • APC Sénégal • Document à usage unique
      </footer>
    </div>
  );
};
