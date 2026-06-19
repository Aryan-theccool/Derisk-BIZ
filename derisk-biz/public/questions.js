/* ─────────────────────────────────────────────────────────────
   DeRisk.biz — All survey content (from the DR Biz brief)
   ───────────────────────────────────────────────────────────── */

const NEWS_TICKERS = [
  {
    text: 'Indian Companies Giving Too Many Employees AI Tools Access to Sensitive Data',
    url: 'https://www.cnbctv18.com/technology/indias-companies-are-giving-too-many-people-and-ai-tools-access-to-sensitive-data-19913043.htm',
  },
  {
    text: "The Illusion of Privacy In India's AI Boom",
    url: 'https://economictimes.indiatimes.com/news/company/corporate-trends/the-illusion-of-privacy-in-indias-ai-boom/articleshow/125842310.cms?from=mdr',
  },
  {
    text: "India's Finance Ministry Asks Employees To Avoid AI Tools Like ChatGPT",
    url: 'https://www.reuters.com/technology/artificial-intelligence/indias-finance-ministry-asks-employees-avoid-ai-tools-like-chatgpt-deepseek-2025-02-05/?utm_source=chatgpt.com',
  },
  {
    text: 'Indian Businesses Lag In AI Security and Effective Monitoring',
    url: 'https://economictimes.indiatimes.com/tech/artificial-intelligence/indian-businesses-lag-in-ai-security-81-lack-effective-monitoring-survey/articleshow/125739254.cms?utm_source=chatgpt.com&from=mdr',
  },
  {
    text: '77% Employees Share Company Secrets on ChatGPT',
    url: 'https://www.peoplematters.in/news/ai-and-emerging-tech/77percent-of-employees-share-company-secrets-on-chatgpt-report-46778?utm_source=chatgpt.com',
  },
  {
    text: 'Watch Out!! Your Workers Might Be Pasting Company Secrets Into ChatGPT',
    url: 'https://www.techradar.com/pro/security/watch-out-your-workers-might-be-pasting-company-secrets-into-chatgpt?utm_source=chatgpt.com',
  },
];

/* SECTION 1 — CONTEXT SETTING (Survey 1) */
const CONTEXT_QUESTIONS = [
  {
    id: 'ctx1',
    question: 'What best describes your role?',
    type: 'single',
    options: [
      'CEO / Founder / Managing Director / Chairman',
      'Investor - Angel / AIF / VC / PE / Family Office',
      'CFO / Finance Head',
      'Chief Legal Officer / General Counsel / Legal Head',
      'COO / Business Head',
      'Chief Compliance / Risk Officer',
      'CIO / CTO / CISO',
      'Board Member / Independent Director',
    ],
    other: 'Other (Specify)',
  },
  {
    id: 'ctx2',
    question: 'Which of the following best describes your company?',
    type: 'single',
    options: [
      'Listed company',
      'Large private company',
      'PE / VC-backed growth company',
      'Financial services / NBFC / fintech / Crypto',
      'Regulated digital platform',
      'Unregulated digital platform',
      'Manufacturing / industrial enterprise',
      'Healthcare / pharma / life sciences',
      'Technology / SaaS / AI-native company',
      'Family-owned business / conglomerate',
    ],
    other: 'Other (specify)',
  },
  {
    id: 'ctx3',
    question: 'Approximate company size',
    type: 'single',
    options: ['Less than 100 employees', '100 – 500', '500 – 2,000', '2,000 – 10,000', '10,000+'],
  },
  {
    id: 'ctx4',
    question: 'Which functions most often handle highly sensitive documents in your organisation? (Select all that apply)',
    type: 'multi',
    options: [
      'Legal',
      'Finance',
      'Compliance / Audit',
      'M&A / Strategy',
      'HR / Employment',
      'Procurement / Contracts',
      'Sales / Commercial',
      'Board / Promoter office',
      'Data protection / InfoSec',
    ],
    other: 'Others (specify)',
  },
  {
    id: 'ctx5',
    question: 'Do you currently use any Legal AI tool?',
    type: 'single',
    options: [
      'Considering deploying',
      'No, they are expensive, low ROI, and pose high confidentiality risk',
      'I have no idea of any Legal AI tools',
    ],
    other: 'Yes (give name)',
  },
];

/* SECTION 2 — SCENARIO-BASED STRATEGIC READINESS FILTER (Survey 1) */
const GOVERNANCE_SCENARIOS = [
  {
    id: 'gov1',
    title: 'Scenario 1 — Detect Risks Before Regulators Do',
    scenario:
      'The Board wants to detect governance risks before regulators, whistleblowers or lenders do. Regulators already connect data across GST, tax, banking and third-party sources. Is your organization doing the same?',
    question: 'What should leadership prioritise?',
    options: [
      'Increase specialist teams and periodic audits to identify issues manually.',
      'Introduce additional dashboards and reporting tools across functions.',
      'Review interconnected data only after notices, investigations or complaints arise.',
      'Continuously connect legal, finance, tax, HR, compliance and operational data to surface emerging risk patterns early.',
    ],
    best: 3,
  },
  {
    id: 'gov2',
    title: 'Scenario 2 — AI Speed Without Losing Control',
    scenario:
      "Leadership wants AI capabilities for contracts, investigations, due diligence and legal workflows—but does not want sensitive information leaving the company's environment.",
    question: 'What is the most defensible approach?',
    options: [
      'Use public AI tools with redaction and internal confidentiality safeguards.',
      'Use public AI tools only for low-risk drafting and research.',
      'Deploy AI within a private enterprise environment operating on company-controlled infrastructure.',
      'Restrict AI use for sensitive matters and rely primarily on manual reviews.',
    ],
    best: 2,
  },
  {
    id: 'gov3',
    title: 'Scenario 3 — From Legal Answers to Enterprise Intelligence',
    scenario:
      'A legal AI tool answers legal questions well. But leadership needs to understand exposures, impacted contracts, financial consequences, governance patterns and threats to enterprise value.',
    question: 'What distinguishes the more strategic AI deployment?',
    options: [
      'A system that generates legal summaries, templates and research outputs.',
      'A system that converts enterprise information into risk maps, connects internal data and recommends actions.',
      'A system that improves collaboration with external counsel and advisers.',
      'A system that stores notices, contracts and legal records in a searchable repository.',
    ],
    best: 1,
  },
  {
    id: 'gov4',
    title: 'Scenario 4 — Real-Time External Intelligence',
    scenario:
      'If a regulator, journalist, competitor and activist investor are discussing a risk affecting your business today, how quickly would that reach your Board in an actionable form?',
    question: 'What is the best approach?',
    options: [
      'Continuously monitor regulators, competitors, industry developments and social media, and provide real-time alerts and insights.',
      'Depend on official circulars, notices and periodic internal reviews.',
      'Rely on consultants and advisers to escalate developments.',
      'Review major developments during scheduled leadership and board meetings.',
    ],
    best: 0,
  },
  {
    id: 'gov5',
    title: 'Scenario 5 — Enterprise Value, Not AI Theatre',
    scenario:
      'The CFO supports AI only if it improves decision-making, reduces costs, accelerates response times and prevents expensive governance surprises.',
    question: 'How should AI investments be evaluated?',
    options: [
      'Position AI as an innovation initiative to enhance the company\'s image.',
      'Focus primarily on productivity gains and document summarisation.',
      'Tie AI adoption to measurable outcomes such as faster decisions, reduced risk and improved governance.',
      'Pilot inexpensive tools first and scale later if adoption increases.',
    ],
    best: 2,
  },
];

const GOVERNANCE_COMPLETION_MESSAGE =
  'DeRisk.biz is a private AI risk intelligence layer for CXOs — deployable inside your own network — that helps companies triangulate contracts, legal, financial, compliance, and governance data into faster, safer, decision-ready insight.';

/* SURVEY 2 — Legal AI vs Enterprise Risk AI */
const LEGAL_VS_ENTERPRISE_SCENARIOS = [
  {
    id: 'lva1',
    title: 'Scenario 1 — AI Adoption Without Losing Control',
    scenario:
      'Leadership wants AI capabilities for legal, compliance and governance workflows, but is concerned about whether sensitive matter context, legal reasoning and enterprise intelligence help Legal AI platform to train itself and benefit competitors.',
    question: 'What is the most defensible approach?',
    options: [
      'Rely on reputable external AI platforms and their security controls.',
      'Use external AI tools only for low-risk drafting and research tasks.',
      'Use advanced AI models where appropriate, while keeping sensitive data, permissions and orchestration within a controlled enterprise environment.',
      'Restrict AI use for sensitive matters and rely primarily on manual reviews.',
    ],
    best: 2,
  },
  {
    id: 'lva2',
    title: 'Scenario 2 — Legal AI vs Enterprise Intelligence',
    scenario:
      'A legal AI tool answers legal questions well. But the CEO, CFO and Board need to understand exposures, governance patterns and threats to enterprise value.',
    question: 'What capability creates greater enterprise value?',
    options: [
      'Faster legal review and contract workflows.',
      'Connected intelligence across legal, finance, compliance and operations.',
      'Expanded legal templates, playbooks and knowledge repositories.',
      'Improved management of external counsel and advisers.',
    ],
    best: 1,
  },
  {
    id: 'lva3',
    title: 'Scenario 3 — From Contract Risk to Enterprise Risk',
    scenario:
      'A legal AI tool flags a critical contract risk. Management now needs to understand its impact on lenders, insurance, revenue concentration and board oversight.',
    question: 'What capability is most valuable?',
    options: [
      'AI that improves legal review and issue spotting.',
      'AI that speeds up contract negotiations and approvals.',
      'AI that connects legal findings to financial, governance and strategic risks.',
      'AI that creates executive summaries and contract reports.',
    ],
    best: 2,
  },
  {
    id: 'lva4',
    title: 'Scenario 4 — Building a Proprietary Small Language Model (SLM) Moat',
    scenario:
      "A high-quality Legal AI platform can improve legal workflows. But the company's real advantage lies in its own deal history, board decisions, regulator interactions and governance knowledge.",
    question: 'What should leadership prioritise?',
    options: [
      'Faster workflows and improved legal productivity.',
      'Better search, reporting and collaboration tools.',
      'Broader document automation and knowledge management.',
      'A proprietary intelligence layer that continuously learns from enterprise data.',
    ],
    best: 3,
  },
  {
    id: 'lva5',
    title: 'Scenario 5 — Department Tool or CXO Tool?',
    scenario:
      'A legal team wants AI for contracts and advisory work. The CEO wants one answer: "What should I worry about right now across contracts, litigation, compliance and governance?"',
    question: 'What best addresses leadership needs?',
    options: [
      'A document intelligence platform for legal workflows.',
      'A workflow automation system using templates and approvals.',
      'A private intelligence layer that converts enterprise data into decision-ready insights.',
      'A knowledge assistant built on policies and internal guidance.',
    ],
    best: 2,
  },
];

const LEGAL_VS_ENTERPRISE_COMPLETION_MESSAGE =
  'Most legal AI tools improve legal workflow. DeRisk.biz is designed to help CXOs convert sensitive legal, financial, compliance, contractual, and governance data into private, decision-ready enterprise intelligence.';

const CONTACT_EMAIL = 'derisk.biz@gmail.com';
