import { ResumeData } from './resume';

export const emptyResumeData: ResumeData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    targetRole: '',
    yearsOfExperience: '0 (Fresher / Entry Level)',
    experienceField: '',
    summary: '',
    photoUrl: '',
    showPhoto: false,
  },
  links: [],
  skills: [],
  experiences: [],
  education: [],
  projects: [],
  certifications: [],
  achievements: [],
};

// 1. Satyam Singh (Includes certifications from Satyam_Singh_Resume.pdf)
export const satyamResumeData: ResumeData = {
  personalInfo: {
    fullName: 'Satyam Singh',
    email: 'satyam.singh261103@gmail.com',
    phone: '+91-8169237833',
    location: 'Mumbai, India',
    targetRole: 'Java Developer / Software Engineer',
    yearsOfExperience: '0 (Fresher / Entry Level)',
    experienceField: 'Backend & Enterprise Development',
    summary:
      'B.Tech Computer Engineering graduate with foundational knowledge of Core Java, SQL, Data Structures and Algorithms, and Object-Oriented Programming. Experienced in REST API architecture, HTTP methods, and MVC patterns with hands-on enterprise project experience in Spring Boot.',
    showPhoto: false,
  },
  links: [
    { id: '1', platform: 'LinkedIn', url: 'https://linkedin.com' },
    { id: '2', platform: 'LeetCode', url: 'https://leetcode.com' },
    { id: '3', platform: 'GitHub', url: 'https://github.com' },
  ],
  skills: [
    { id: '1', name: 'Java (OOP, Collections)', level: 'Professional' },
    { id: '2', name: 'Spring Boot & Spring Security', level: 'Intermediate' },
    { id: '3', name: 'SQL & MySQL 8.0', level: 'Intermediate' },
    { id: '4', name: 'Hibernate / JPA', level: 'Intermediate' },
    { id: '5', name: 'Docker & Multi-stage Builds', level: 'Intermediate' },
    { id: '6', name: 'REST APIs & MVC Architecture', level: 'Professional' },
    { id: '7', name: 'JavaScript & React.js', level: 'Beginner' },
  ],
  experiences: [
    {
      id: '1',
      company: 'Enterprise Academic Projects',
      role: 'Backend Engineering Trainee',
      startDate: '2023',
      endDate: '2026',
      isCurrent: true,
      rawDetails: 'Built customer support CRM, handled database relationships and security.',
      enhancedBullets: [
        'Engineered enterprise ticketing platforms using Java 21 and Spring Boot, servicing structured ticket flows.',
        'Designed normalized relational schemas in MySQL 8.0 with Hibernate/JPA and optimistic concurrency locking.',
        'Containerized multi-tier backend services using Docker on Alpine Linux, achieving streamlined cloud deployments on Render.',
      ],
    },
  ],
  education: [
    {
      id: '1',
      institution: 'University of Mumbai',
      degree: 'B.Tech',
      fieldOfStudy: 'Computer Engineering',
      graduationYear: '2021 - 2026',
      scoreOrGpa: 'CGPA 7.12',
    },
    {
      id: '2',
      institution: 'Maharashtra State Board',
      degree: 'HSC & SSC',
      fieldOfStudy: 'Science & General',
      graduationYear: '2019 - 2021',
      scoreOrGpa: 'HSC: 86.83% | SSC: 74.60%',
    },
  ],
  projects: [
    {
      id: '1',
      title: 'SupportDesk - Customer Support Ticketing CRM',
      techStack: ['Java 21', 'Spring Boot', 'Spring Security', 'MySQL', 'Docker'],
      description:
        'Engineered an enterprise ticketing platform with role-based agent authentication, Cloudinary Java SDK avatar integration, and Gmail SMTP real-time notifications.',
    },
    {
      id: '2',
      title: 'NutriScan - Food Health & Sustainability Scanner',
      techStack: ['JavaScript', 'REST API', 'HTML/CSS'],
      description:
        'Collaborative web platform evaluating food nutrition and environmental footprint metrics with responsive UI and user flow planning.',
    },
  ],
  certifications: [
    { id: '1', name: 'Java, Python, C, PHP & MySQL', issuer: 'Spoken Tutorial, IIT Bombay' },
    { id: '2', name: 'Programming and Data Structure Test', issuer: 'AICTE PARAKH' },
    { id: '3', name: 'Python Essentials 2', issuer: 'Cisco Networking Academy' },
    { id: '4', name: 'Full Stack, Cloud Computing & Virtualization', issuer: 'Infosys' },
  ],
  achievements: [
    {
      id: '1',
      title: 'Enterprise Containerized Architecture',
      description: 'Successfully deployed production-ready multi-stage Spring Boot application to Render with live Cloudinary media management.',
    },
  ],
};

// 2. Pawan Sodham (Includes certifications from Pawan_Resume2.pdf)
export const pawanResumeData: ResumeData = {
  personalInfo: {
    fullName: 'Pawan Sodham',
    email: 'pawansodham04@gmail.com',
    phone: '+91 9867754851',
    location: 'Mumbai, India',
    targetRole: 'Full Stack Developer / MERN Engineer',
    yearsOfExperience: '0 (Fresher / Entry Level)',
    experienceField: 'Full-Stack Web Development & ML',
    summary:
      'Computer Engineering undergraduate with practical expertise in MERN stack architecture, state management with Redux/RTK Query, and predictive machine learning models. Proven record of building high-performance web applications with secure JWT auth and payment gateway integrations.',
    showPhoto: false,
  },
  links: [
    { id: '1', platform: 'LinkedIn', url: 'https://linkedin.com' },
    { id: '2', platform: 'GitHub', url: 'https://github.com' },
    { id: '3', platform: 'LeetCode', url: 'https://leetcode.com' },
  ],
  skills: [
    { id: '1', name: 'React.js & Tailwind CSS', level: 'Professional' },
    { id: '2', name: 'Node.js & Express.js', level: 'Professional' },
    { id: '3', name: 'MongoDB & Aggregation', level: 'Professional' },
    { id: '4', name: 'JavaScript & Python', level: 'Professional' },
    { id: '5', name: 'RTK Query & Redux Toolkit', level: 'Intermediate' },
    { id: '6', name: 'Machine Learning (Scikit-Learn)', level: 'Intermediate' },
  ],
  experiences: [
    {
      id: '1',
      company: 'Full Stack Projects',
      role: 'MERN Stack Developer',
      startDate: '2023',
      endDate: '2026',
      isCurrent: true,
      rawDetails: 'Built full-stack platforms, handled payment processing integrations.',
      enhancedBullets: [
        'Architected end-to-end LMS platforms supporting custom role hierarchies, Stripe checkout, and RTK Query state syncing.',
        'Engineered responsive bookstore e-commerce workflows with JWT authentication and advanced MongoDB aggregation pipelines.',
        'Trained 4 comparative machine learning algorithms across 15+ years of NASA climate data with automated emergency SMS dispatches.',
      ],
    },
  ],
  education: [
    {
      id: '1',
      institution: 'Shah & Anchor Kutchhi Engineering College',
      degree: 'B.Tech',
      fieldOfStudy: 'Computer Engineering',
      graduationYear: '2022 - 2026',
      scoreOrGpa: 'CGPA 7.78/10',
    },
  ],
  projects: [
    {
      id: '1',
      title: 'LMS E-Learning Platform',
      techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Stripe', 'RTK Query'],
      description:
        'Full-stack learning system with instructor course publishing, student enrollment, secure Stripe payment processing, and Cloudinary media streaming.',
    },
    {
      id: '2',
      title: 'ResqNet - Disaster Prediction System',
      techStack: ['React', 'Flask', 'Python ML', 'Firebase', 'Twilio'],
      description:
        'Real-time disaster forecasting platform with trained ML models on NASA climate data and automated emergency Twilio SMS dispatches.',
    },
  ],
  certifications: [
    { id: '1', name: 'AWS Cloud Practitioner Essentials', issuer: 'Amazon Web Services (AWS)' },
    { id: '2', name: 'Python (40%), PHP + MySQL (69.4%), Linux (61.1%)', issuer: 'Spoken Tutorial, IIT Bombay' },
    { id: '3', name: 'Python Essentials 2', issuer: 'Cisco Networking Academy' },
  ],
  achievements: [
    {
      id: '1',
      title: 'NASA Climate Data ML Pipeline',
      description: 'Engineered high-accuracy comparative classification framework spanning 15+ years of satellite observations.',
    },
  ],
};

// 3. Corporate Lawyer
export const lawyerResumeData: ResumeData = {
  personalInfo: {
    fullName: 'Ananya Deshmukh, Esq.',
    email: 'ananya.deshmukh.legal@gmail.com',
    phone: '+91 98201 44321',
    location: 'New Delhi, India',
    targetRole: 'Corporate Legal Counsel / Senior Associate',
    yearsOfExperience: '3-5 years',
    experienceField: 'Corporate Law, Compliance & Arbitration',
    summary:
      'High-performing Corporate Advocate with 4+ years of experience drafting complex commercial agreements, managing cross-border M&A transactions, and handling regulatory compliance under the Companies Act and SEBI regulations.',
    showPhoto: false,
  },
  links: [
    { id: '1', platform: 'LinkedIn', url: 'https://linkedin.com' },
  ],
  skills: [
    { id: '1', name: 'Contract Drafting & Negotiation', level: 'Professional' },
    { id: '2', name: 'Mergers & Acquisitions Due Diligence', level: 'Professional' },
    { id: '3', name: 'SEBI & RBI Regulatory Compliance', level: 'Professional' },
  ],
  experiences: [
    {
      id: '1',
      company: 'Shardul Legal Associates LLP',
      role: 'Senior Associate - Corporate & Commercial',
      startDate: '2022',
      endDate: 'Present',
      isCurrent: true,
      rawDetails: 'Handled investment contracts, performed diligence, and negotiated disputes.',
      enhancedBullets: [
        'Reviewed, negotiated, and closed 75+ commercial master service agreements (MSAs) and vendor contracts.',
        'Spearheaded legal due diligence for 6 Series A/B startup investment rounds aggregating over $42M in capital injection.',
      ],
    },
  ],
  education: [
    {
      id: '1',
      institution: 'National Law School of India University (NLSIU)',
      degree: 'B.A. LL.B. (Hons.)',
      fieldOfStudy: 'Corporate Law',
      graduationYear: '2021',
    },
  ],
  projects: [],
  certifications: [
    { id: '1', name: 'Advocate Enrollment Certificate', issuer: 'Bar Council of Delhi' },
  ],
  achievements: [
    { id: '1', title: 'National Moot Court Competition Winner', description: 'Ranked 1st place in Commercial Arbitration Category.' },
  ],
};

// 4. Physician / Doctor
export const doctorResumeData: ResumeData = {
  personalInfo: {
    fullName: 'Dr. Siddharth Verma, MBBS',
    email: 'dr.siddharth.verma@apollohosp.com',
    phone: '+91 97112 88490',
    location: 'Bangalore, India',
    targetRole: 'Resident Medical Officer / Internal Medicine Specialist',
    yearsOfExperience: '3-5 years',
    experienceField: 'Emergency Medicine, ICU Care & Diagnostics',
    summary:
      'Compassionate board-certified Medical Practitioner with extensive clinical training in acute inpatient management, emergency trauma stabilization, and critical care diagnostics.',
    showPhoto: false,
  },
  links: [],
  skills: [
    { id: '1', name: 'Trauma & Emergency Resuscitation (ACLS/BLS)', level: 'Professional' },
    { id: '2', name: 'ICU Ventilator Protocol', level: 'Professional' },
  ],
  experiences: [
    {
      id: '1',
      company: 'Apollo Multi-Specialty Hospital',
      role: 'Resident Medical Officer (ICU & ER)',
      startDate: '2022',
      endDate: 'Present',
      isCurrent: true,
      rawDetails: 'Handled emergency shifts, rounds in ICU.',
      enhancedBullets: [
        'Managed daily inpatient rounds for a 28-bed high-acuity Intensive Care Unit.',
        'Delivered frontline emergency resuscitation for 500+ acute admissions.',
      ],
    },
  ],
  education: [
    {
      id: '1',
      institution: 'Kasturba Medical College (KMC Manipal)',
      degree: 'MBBS',
      fieldOfStudy: 'Medicine & Surgery',
      graduationYear: '2021',
    },
  ],
  projects: [],
  certifications: [
    { id: '1', name: 'Advanced Cardiovascular Life Support (ACLS)', issuer: 'American Heart Association' },
  ],
  achievements: [
    { id: '1', title: 'Best Resident Clinician Award', description: 'Recognized for clinical responsiveness during acute ICU emergencies.' },
  ],
};

// 5. STEM Teacher
export const teacherResumeData: ResumeData = {
  personalInfo: {
    fullName: 'Meera Iyer, M.Sc., B.Ed.',
    email: 'meera.iyer.edu@gmail.com',
    phone: '+91 99302 77119',
    location: 'Pune, India',
    targetRole: 'Senior STEM Educator / High School Physics Teacher',
    yearsOfExperience: '5+ years',
    experienceField: 'Curriculum Development & Experiential Learning',
    summary:
      'High School Physics & Mathematics Teacher with 6+ years of classroom experience teaching CBSE and IB curricula.',
    showPhoto: false,
  },
  links: [],
  skills: [
    { id: '1', name: 'Curriculum & Lesson Planning', level: 'Professional' },
    { id: '2', name: 'Interactive Lab Demonstration', level: 'Professional' },
  ],
  experiences: [
    {
      id: '1',
      company: 'The Heritage International School',
      role: 'Head of Physics Department',
      startDate: '2020',
      endDate: 'Present',
      isCurrent: true,
      rawDetails: 'Taught Grade 11 and 12, ran physics labs.',
      enhancedBullets: [
        'Instructed 240+ students annually in AP and Grade 12 Physics.',
      ],
    },
  ],
  education: [
    {
      id: '1',
      institution: 'Savitribai Phule Pune University',
      degree: 'M.Sc. & B.Ed.',
      fieldOfStudy: 'Applied Physics & Education',
      graduationYear: '2019',
    },
  ],
  projects: [],
  certifications: [
    { id: '1', name: 'IBDP Category 1 Physics Certification', issuer: 'International Baccalaureate Organization' },
  ],
  achievements: [
    { id: '1', title: '100% Board Exam Pass Rate', description: 'Consecutively achieved 100% first-class pass rates in physics boards over 4 years.' },
  ],
};

// 6. Sales Executive
export const salesResumeData: ResumeData = {
  personalInfo: {
    fullName: 'Rahul Mukherjee',
    email: 'rahul.mukherjee.sales@gmail.com',
    phone: '+91 98450 11982',
    location: 'Gurgaon, India',
    targetRole: 'Enterprise Account Executive / B2B SaaS Sales Lead',
    yearsOfExperience: '5+ years',
    experienceField: 'SaaS Sales & Pipeline Generation',
    summary:
      'Enterprise SaaS Sales Professional with 5+ years of closing mid-market and Fortune 500 deals across APAC.',
    showPhoto: false,
  },
  links: [],
  skills: [{ id: '1', name: 'Enterprise Pipeline Generation (MEDDIC)', level: 'Professional' }],
  experiences: [
    {
      id: '1',
      company: 'Freshworks Inc.',
      role: 'Senior Enterprise Account Executive',
      startDate: '2021',
      endDate: 'Present',
      isCurrent: true,
      rawDetails: 'Closed enterprise deals.',
      enhancedBullets: ['Generated $1.45M in new Net ARR across FY24, achieving 138% of quota.'],
    },
  ],
  education: [
    {
      id: '1',
      institution: 'Symbiosis Institute of Business Management (SIBM)',
      degree: 'MBA',
      fieldOfStudy: 'Marketing',
      graduationYear: '2019',
    },
  ],
  projects: [],
  certifications: [{ id: '1', name: 'Salesforce Certified Administrator', issuer: 'Salesforce' }],
  achievements: [{ id: '1', title: 'President’s Club Award 2023', description: 'Awarded top sales executive for exceeding revenue targets by 140%.' }],
};

// 7. Product Designer
export const designerResumeData: ResumeData = {
  personalInfo: {
    fullName: 'Tanvi Nair',
    email: 'tanvi.design@uxstudio.io',
    phone: '+91 97690 32188',
    location: 'Bangalore, India',
    targetRole: 'Senior UI/UX Product Designer',
    yearsOfExperience: '3-5 years',
    experienceField: 'Design Systems, Mobile UX & Prototyping',
    summary: 'Product Designer specializing in design systems, mobile apps, and rapid interactive prototyping.',
    showPhoto: false,
  },
  links: [],
  skills: [{ id: '1', name: 'Figma, Auto Layout & Design Tokens', level: 'Professional' }],
  experiences: [
    {
      id: '1',
      company: 'Razorpay Design Labs',
      role: 'Product Designer',
      startDate: '2022',
      endDate: 'Present',
      isCurrent: true,
      rawDetails: 'Designed dashboard.',
      enhancedBullets: ['Redesigned core merchant settlement dashboard utilized by 120,000+ businesses daily.'],
    },
  ],
  education: [
    {
      id: '1',
      institution: 'National Institute of Design (NID Ahmedabad)',
      degree: 'B.Des',
      fieldOfStudy: 'Interaction Design',
      graduationYear: '2021',
    },
  ],
  projects: [],
  certifications: [{ id: '1', name: 'Nielsen Norman Group UX Master Certified', issuer: 'NN/g' }],
  achievements: [{ id: '1', title: 'Red Dot Design Award Nominee', description: 'Recognized for accessible financial interface workflows.' }],
};

// 8. Financial Analyst
export const financeResumeData: ResumeData = {
  personalInfo: {
    fullName: 'Aditya Kulkarni, CFA',
    email: 'aditya.kulkarni.cfa@gmail.com',
    phone: '+91 98214 77203',
    location: 'Mumbai, India',
    targetRole: 'Investment Banking Analyst / Equity Research Lead',
    yearsOfExperience: '3-5 years',
    experienceField: 'Financial Modeling, Valuation & M&A',
    summary: 'CFA charterholder with 4 years of experience specializing in DCF valuation and equity research.',
    showPhoto: false,
  },
  links: [],
  skills: [{ id: '1', name: 'DCF & LBO Financial Modeling', level: 'Professional' }],
  experiences: [
    {
      id: '1',
      company: 'Kotak Institutional Equities',
      role: 'Equity Research Analyst',
      startDate: '2022',
      endDate: 'Present',
      isCurrent: true,
      rawDetails: 'Built valuation models.',
      enhancedBullets: ['Formulated dynamic 3-statement financial valuation models for 14 publicly traded companies.'],
    },
  ],
  education: [
    {
      id: '1',
      institution: 'NMIMS Mumbai',
      degree: 'B.Sc. in Finance',
      fieldOfStudy: 'Corporate Finance',
      graduationYear: '2021',
    },
  ],
  projects: [],
  certifications: [{ id: '1', name: 'CFA Charterholder', issuer: 'CFA Institute' }],
  achievements: [{ id: '1', title: 'Top Ranked Equity Research Note', description: 'Awarded best regional consumer tech valuation thesis.' }],
};

// 9. HR Talent Lead
export const hrResumeData: ResumeData = {
  personalInfo: {
    fullName: 'Pooja Chawla, SHRM-CP',
    email: 'pooja.chawla.hr@gmail.com',
    phone: '+91 99100 55432',
    location: 'Hyderabad, India',
    targetRole: 'Senior Talent Acquisition Lead',
    yearsOfExperience: '5+ years',
    experienceField: 'Tech Recruiting & HR Analytics',
    summary: 'Strategic HR and Technical Recruiting Specialist with 5+ years of full-lifecycle talent acquisition experience.',
    showPhoto: false,
  },
  links: [],
  skills: [{ id: '1', name: 'Full-Cycle Technical Recruiting', level: 'Professional' }],
  experiences: [
    {
      id: '1',
      company: 'Swiggy',
      role: 'Lead Technical Recruiter',
      startDate: '2021',
      endDate: 'Present',
      isCurrent: true,
      rawDetails: 'Hired engineers.',
      enhancedBullets: ['Orchestrated recruitment for 90+ Senior Backend and ML engineers across 18 months.'],
    },
  ],
  education: [
    {
      id: '1',
      institution: 'TISS Mumbai',
      degree: 'M.A.',
      fieldOfStudy: 'Human Resources',
      graduationYear: '2020',
    },
  ],
  projects: [],
  certifications: [{ id: '1', name: 'SHRM Certified Professional (SHRM-CP)', issuer: 'SHRM' }],
  achievements: [{ id: '1', title: 'Recruiter of the Year', description: 'Awarded for slashing average time-to-hire by 40%.' }],
};

// 10. Data Scientist
export const dataScientistResumeData: ResumeData = {
  personalInfo: {
    fullName: 'Karthik Ramanathan',
    email: 'karthik.ai@gmail.com',
    phone: '+91 98402 99182',
    location: 'Chennai, India',
    targetRole: 'Senior Data Scientist / Machine Learning Engineer',
    yearsOfExperience: '3-5 years',
    experienceField: 'Deep Learning, NLP & Predictive Analytics',
    summary: 'Data Scientist with 4+ years of production experience deploying scalable transformer models and ML pipelines.',
    showPhoto: false,
  },
  links: [],
  skills: [{ id: '1', name: 'Python, PyTorch & LLM Fine-tuning', level: 'Professional' }],
  experiences: [
    {
      id: '1',
      company: 'Fractal Analytics',
      role: 'Senior Data Scientist',
      startDate: '2022',
      endDate: 'Present',
      isCurrent: true,
      rawDetails: 'Trained models.',
      enhancedBullets: ['Built and deployed customer churn prediction pipelines serving 2.5M daily active users.'],
    },
  ],
  education: [
    {
      id: '1',
      institution: 'IIT Madras',
      degree: 'B.Tech + M.Tech',
      fieldOfStudy: 'Data Science',
      graduationYear: '2021',
    },
  ],
  projects: [],
  certifications: [{ id: '1', name: 'TensorFlow Developer Certificate', issuer: 'Google' }],
  achievements: [{ id: '1', title: 'Kaggle Grandmaster', description: 'Ranked in top 0.1% worldwide in NLP and tabular competitions.' }],
};

export const initialResumeData: ResumeData = satyamResumeData;