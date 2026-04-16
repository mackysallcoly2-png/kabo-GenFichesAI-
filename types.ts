
export enum SheetType {
  LESSON = 'LESSON',
  EXERCISE = 'EXERCISE',
  EVALUATION = 'EVALUATION'
}

export interface PedagogicalStep {
  name: string;
  objective: string;
  teacherActivity: string;
  studentActivity: string;
}

export interface PedagogicalSheet {
  id: string;
  title: string;
  discipline?: string; 
  subject: string; 
  domain: string; 
  subDomain: string; 
  gradeLevel: string; 
  cb: string; 
  palier: string; 
  oa: string; 
  os: string; 
  contenu: string; 
  type: SheetType;
  duration: string;
  material: {
    collective: string;
    individual: string;
  };
  reference: string; 
  steps: PedagogicalStep[];
  createdAt: number;
}

export interface GenerationRequest {
  topic: string;
  gradeLevel: string;
  activity: string;
  languages: string[]; // Modifié pour supporter plusieurs langues
}
