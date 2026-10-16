import type { ResumeData } from '@/types/resume';

// A made-up profile used only for the home page previews.
// Contact details use example.com so no real person's data is shown.
export const landingDemoResume: ResumeData = {
  personalInfo: {
    fullName: 'Aarav Mehta',
    targetRole: 'Full Stack Developer',
    email: 'aarav.mehta@example.com',
    phone: '+91 98765 43210',
    location: 'Bengaluru, India',
    summary:
      'Full stack developer with 3 years of experience building React and Node.js products for fintech teams. Designs clean REST APIs, writes tested TypeScript, and ships accessible interfaces used daily by operations staff. Focused on reliable, well-documented software that small teams can maintain.',
    yearsOfExperience: '3',
    experienceField: 'Web Development',
  },
  links: [
    { id: 'l1', platform: 'GitHub', url: 'https://github.com' },
    { id: 'l2', platform: 'LinkedIn', url: 'https://linkedin.com' },
  ],
  skills: [
    { id: 's1', name: 'TypeScript' },
    { id: 's2', name: 'React' },
    { id: 's3', name: 'Next.js' },
    { id: 's4', name: 'Node.js' },
    { id: 's5', name: 'PostgreSQL' },
    { id: 's6', name: 'REST APIs' },
    { id: 's7', name: 'Docker' },
    { id: 's8', name: 'Jest' },
  ],
  experiences: [
    {
      id: 'e1',
      company: 'Northwind Fintech',
      role: 'Software Engineer',
      startDate: '2023',
      endDate: '',
      isCurrent: true,
      rawDetails: '',
      enhancedBullets: [
        'Built a React dashboard that lets operations staff review loan applications in one place.',
        'Designed Node.js and PostgreSQL endpoints for document upload and status tracking.',
        'Added Jest and Playwright tests to the release pipeline to catch regressions before deployment.',
      ],
    },
    {
      id: 'e2',
      company: 'Brightpath Studio',
      role: 'Junior Developer',
      startDate: '2021',
      endDate: '2023',
      isCurrent: false,
      rawDetails: '',
      enhancedBullets: [
        'Developed responsive websites with Next.js and Tailwind CSS for small business clients.',
        'Maintained a shared component library used across client projects.',
      ],
    },
  ],
  projects: [
    {
      id: 'p1',
      title: 'ExpenseFlow',
      techStack: ['Next.js', 'Prisma', 'PostgreSQL'],
      description: 'Personal finance tracker with category budgets, CSV import, and monthly charts.',
    },
    {
      id: 'p2',
      title: 'TeamDocs Search',
      techStack: ['Node.js', 'Elasticsearch'],
      description: 'Full-text search for internal team documentation with tag filters.',
    },
  ],
  education: [
    {
      id: 'ed1',
      institution: 'State Institute of Technology',
      degree: 'B.Tech',
      fieldOfStudy: 'Computer Science',
      graduationYear: '2021',
      scoreOrGpa: 'CGPA 8.4',
    },
  ],
  certifications: [
    { id: 'c1', name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services' },
  ],
  achievements: [
    { id: 'a1', title: 'Hackathon finalist', description: 'Top 5 of 120 teams at a city fintech hackathon.' },
  ],
};
