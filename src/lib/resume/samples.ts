import type { CareerStage, ResumeData } from '@/types/resume';
import {
  dataScientistResumeData,
  designerResumeData,
  doctorResumeData,
  financeResumeData,
  hrResumeData,
  lawyerResumeData,
  pawanResumeData,
  salesResumeData,
  satyamResumeData,
  teacherResumeData,
} from '@/types/initialResumeData';

export interface SampleProfile {
  id: string;
  name: string;
  role: string;
  careerStage: CareerStage;
  templateId: string;
  data: ResumeData;
}

// Example resumes people can start from ("Start with a template").
export const SAMPLE_PROFILES: SampleProfile[] = [
  { id: 'java', name: 'Satyam Singh', role: 'Java & Spring Boot Engineer', careerStage: 'fresher', templateId: 'modern', data: satyamResumeData },
  { id: 'mern', name: 'Pawan Sodham', role: 'MERN Stack & ML Engineer', careerStage: 'student', templateId: 'modern', data: pawanResumeData },
  { id: 'law', name: 'Ananya Deshmukh', role: 'Corporate Lawyer (LLB)', careerStage: 'experienced', templateId: 'academic', data: lawyerResumeData },
  { id: 'doctor', name: 'Dr. Siddharth Verma', role: 'Physician (MBBS)', careerStage: 'experienced', templateId: 'medical', data: doctorResumeData },
  { id: 'teacher', name: 'Meera Iyer', role: 'STEM Educator (Physics)', careerStage: 'experienced', templateId: 'classic', data: teacherResumeData },
  { id: 'sales', name: 'Rahul Mukherjee', role: 'Enterprise Sales Lead', careerStage: 'experienced', templateId: 'corporate', data: salesResumeData },
  { id: 'design', name: 'Tanvi Nair', role: 'UI/UX Product Designer', careerStage: 'experienced', templateId: 'sidebar', data: designerResumeData },
  { id: 'finance', name: 'Aditya Kulkarni', role: 'Investment Analyst (CFA)', careerStage: 'experienced', templateId: 'compact', data: financeResumeData },
  { id: 'hr', name: 'Pooja Chawla', role: 'HR & Talent Acquisition', careerStage: 'experienced', templateId: 'timeline', data: hrResumeData },
  { id: 'data', name: 'Karthik Ramanathan', role: 'Data Scientist', careerStage: 'experienced', templateId: 'minimal', data: dataScientistResumeData },
];

// Replaces contact details with obvious placeholders, so an example resume
// never carries someone's real email or phone number into a user's resume.
export function sampleForEditing(sample: SampleProfile): ResumeData {
  const data = structuredClone(sample.data);
  const handle = sample.name.toLowerCase().replace(/^dr\.\s*/, '').replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');
  data.personalInfo = {
    ...data.personalInfo,
    email: `${handle}@example.com`,
    phone: '+91 90000 00000',
  };
  return data;
}
