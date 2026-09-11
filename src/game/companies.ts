import type { Company, InterviewQuestion } from '../types/game'

/**
 * Real employers that recruit Indian campus freshers. Packages are approximate base pay in LPA,
 * from publicly reported fresher offers, and vary by year, college and role. Eligibility reflects
 * typical cut-offs; roles, dates and interview flow are simplified for the game.
 * cgpa eligibility is expressed in real CGPA (7.0 = 7.0), converted by the engine.
 */
export const COMPANIES: Company[] = [
  { id: 'tcs', name: 'TCS', role: 'Ninja (Systems Engineer)', packageLpa: 3.4, tagline: 'The NQT. Half the college sits for it.', eligibility: { cgpa: 6.0 }, test: 'aptitude', appearsFrom: 20, appearsTo: 70, tier: 1 },
  { id: 'infosys', name: 'Infosys', role: 'Systems Engineer', packageLpa: 3.6, tagline: 'Mysore campus. Everyone has a cousin who went.', eligibility: { cgpa: 6.5 }, test: 'aptitude', appearsFrom: 22, appearsTo: 72, tier: 1 },
  { id: 'wipro', name: 'Wipro', role: 'Project Engineer', packageLpa: 3.5, tagline: 'Elite NTH. Aptitude, then a coding round.', eligibility: { cgpa: 6.0 }, test: 'aptitude', appearsFrom: 24, appearsTo: 74, tier: 1 },
  { id: 'cognizant', name: 'Cognizant', role: 'GenC Programmer Analyst', packageLpa: 4.0, tagline: 'Three rounds. Communication counts.', eligibility: { cgpa: 6.0 }, test: 'aptitude', appearsFrom: 26, appearsTo: 76, tier: 1 },
  { id: 'accenture', name: 'Accenture', role: 'Associate Software Engineer', packageLpa: 4.5, tagline: 'Cognitive assessment, then a very long form.', eligibility: { cgpa: 6.5 }, test: 'aptitude', appearsFrom: 28, appearsTo: 78, tier: 1 },
  { id: 'zoho', name: 'Zoho', role: 'Member Technical Staff', packageLpa: 7.0, tagline: 'No CGPA cut-off. Five rounds of pure coding.', eligibility: { dsa: 45 }, test: 'dsa', appearsFrom: 30, appearsTo: 78, tier: 2 },
  { id: 'deloitte', name: 'Deloitte', role: 'Analyst', packageLpa: 7.6, tagline: 'Case questions, then "tell me about a time".', eligibility: { cgpa: 7.0, dsa: 35 }, test: 'aptitude', appearsFrom: 34, appearsTo: 80, tier: 2 },
  { id: 'oracle', name: 'Oracle', role: 'Associate Software Engineer', packageLpa: 9.0, tagline: 'SQL, OOP, and one graph question.', eligibility: { cgpa: 7.0, dsa: 50 }, test: 'dsa', appearsFrom: 38, appearsTo: 82, tier: 2 },
  { id: 'flipkart', name: 'Flipkart', role: 'SDE-1', packageLpa: 18, tagline: 'Machine coding round. Bring a working laptop.', eligibility: { cgpa: 7.0, dsa: 60, projects: 55 }, test: 'projects', appearsFrom: 45, appearsTo: 84, tier: 3 },
  { id: 'amazon', name: 'Amazon', role: 'SDE-1', packageLpa: 20, tagline: 'Leadership Principles. All sixteen of them.', eligibility: { cgpa: 7.0, dsa: 70 }, test: 'dsa', appearsFrom: 50, appearsTo: 86, tier: 3 },
  { id: 'microsoft', name: 'Microsoft', role: 'Software Engineer', packageLpa: 25, tagline: 'Four rounds. The group chat has stopped breathing.', eligibility: { cgpa: 7.5, dsa: 75 }, test: 'dsa', appearsFrom: 55, appearsTo: 86, tier: 3 },
  { id: 'google', name: 'Google', role: 'Software Engineer', packageLpa: 30, tagline: 'Two coding rounds, then a "Googleyness" chat.', eligibility: { cgpa: 7.5, dsa: 80, projects: 40 }, test: 'dsa', appearsFrom: 62, appearsTo: 88, tier: 3 },
]

export const COMPANY_MAP: Record<string, Company> = Object.fromEntries(COMPANIES.map((c) => [c.id, c]))

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'intro',
    prompt: 'Tell me about yourself.',
    options: [
      { label: 'Thirty seconds. Degree, one project, what you want.', score: 2, reply: 'The interviewer nods. Nobody has done this in thirty seconds all day.' },
      { label: 'Start from tenth standard.', score: 0, reply: 'Somewhere around your twelfth-standard marks, the interviewer checks the time.' },
      { label: 'Read the resume aloud.', score: 1, reply: '"Yes, I have your resume here." Awkward, but survivable.' },
    ],
  },
  {
    id: 'project',
    prompt: 'Tell me about a project you are proud of.',
    options: [
      { label: 'Explain the problem, your part, what broke.', score: 2, reply: 'They ask a follow-up about the bug. You actually know the answer.' },
      { label: 'Mention that your teammate did most of it.', score: 0, reply: 'Honest. Fatal. The interviewer writes something short.' },
      { label: 'Pivot to your CGPA.', score: 1, reply: '"That is nice. But the project?" You recover, slowly.' },
    ],
  },
  {
    id: 'reverse_ll',
    prompt: 'Reverse a linked list. Walk me through it.',
    options: [
      { label: 'Three pointers. Draw it.', score: 2, reply: 'Clean. They ask for the recursive version, mildly impressed.' },
      { label: '"I would use a library."', score: 0, reply: 'A long pause. The kind you can hear.' },
      { label: 'Start coding, fix it as you go.', score: 1, reply: 'Two null-pointer moments, but you land it.' },
    ],
  },
  {
    id: 'weakness',
    prompt: 'What is your biggest weakness?',
    options: [
      { label: 'A real one, with what you did about it.', score: 2, reply: 'They seem to appreciate a human answer.' },
      { label: '"I work too hard."', score: 0, reply: 'The interviewer has heard this eleven times today. Twelve now.' },
      { label: '"Time management, but I use a planner."', score: 1, reply: 'Fine. Forgettable. Fine.' },
    ],
  },
  {
    id: 'complexity',
    prompt: 'What is the time complexity of your solution?',
    options: [
      { label: 'State it, and say why.', score: 2, reply: '"Correct." One word. It felt like a paragraph.' },
      { label: 'Guess O(n) with confidence.', score: 1, reply: 'It was O(n log n). They let it slide, mostly.' },
      { label: '"It runs fast on my laptop."', score: 0, reply: 'The interviewer smiles in a way that is not a smile.' },
    ],
  },
  {
    id: 'why_us',
    prompt: 'Why do you want to join us?',
    options: [
      { label: 'One specific thing about the company.', score: 2, reply: 'You mention their product. They look surprised anyone read the PPT.' },
      { label: '"It is a great learning opportunity."', score: 1, reply: 'True for every company on Earth. They nod anyway.' },
      { label: '"Honestly, the package."', score: 0, reply: 'Refreshing. Disqualifying.' },
    ],
  },
  {
    id: 'conflict',
    prompt: 'Tell me about a time you disagreed with a teammate.',
    options: [
      { label: 'A small story with a resolution.', score: 2, reply: 'They ask what you would do differently. You have an answer.' },
      { label: '"I never disagree. I am a team player."', score: 0, reply: 'Nobody believes this. Including you.' },
      { label: 'Describe the fight in detail.', score: 1, reply: 'Entertaining. Slightly concerning.' },
    ],
  },
  {
    id: 'questions',
    prompt: 'Do you have any questions for us?',
    options: [
      { label: 'Ask what a first month looks like.', score: 2, reply: 'A genuine answer, and a smile. Good sign.' },
      { label: '"No, all clear."', score: 1, reply: 'The interview ends two minutes early. Neutral.' },
      { label: 'Ask about the appraisal cycle.', score: 0, reply: 'Bold. The interviewer writes "appraisal" and underlines it.' },
    ],
  },
]

export const QUESTION_MAP: Record<string, InterviewQuestion> = Object.fromEntries(INTERVIEW_QUESTIONS.map((q) => [q.id, q]))

/** Fictional names for off-campus / fallback placements. */
export const OFFCAMPUS_COMPANIES = [
  'Infinite Loop Systems', 'NullPointer Technologies', 'Chai & Code Labs', 'Agile Waterfall Inc.',
  'Ctrl+Alt+Deliver', 'Bug Free Software Co.', 'Startup With Fourteen Employees', "Your Friend's Startup",
]
