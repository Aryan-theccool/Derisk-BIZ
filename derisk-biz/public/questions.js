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
    url: 'https://www.reuters.com/technology/artificial-intelligence/indias-finance-ministry-asks-employees-avoid-ai-tools-like-chatgpt-deepseek-2025-02-05/',
  },
  {
    text: 'Indian Businesses Lag In AI Security and Effective Monitoring',
    url: 'https://economictimes.indiatimes.com/tech/artificial-intelligence/indian-businesses-lag-in-ai-security-81-lack-effective-monitoring-survey/articleshow/125739254.cms?from=mdr',
  },
  {
    text: '77% Employees Share Company Secrets on ChatGPT',
    url: 'https://www.peoplematters.in/news/ai-and-emerging-tech/77percent-of-employees-share-company-secrets-on-chatgpt-report-46778',
  },
  {
    text: 'Watch Out!! Your Workers Might Be Pasting Company Secrets Into ChatGPT',
    url: 'https://www.techradar.com/pro/security/watch-out-your-workers-might-be-pasting-company-secrets-into-chatgpt',
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
    title: 'Scenario 1 — Board Wants Early Warning, Not Post-Mortems',
    scenario:
      'The Board is frustrated that every major governance issue is identified too late — after notices arrive, whistleblower allegations escalate, key contracts get breached, or lender pressure builds. They want a system that flags risk patterns earlier by connecting legal, finance, contracts, compliance, and management behaviour.',
    question: 'What should you prioritise?',
    options: [
      'Increase specialist resources to review governance, compliance and operational information manually.',
      'Introduce additional reporting tools to improve visibility across organizational functions.',
      'Strengthen periodic audit processes to identify issues through retrospective reviews.',
      'Deploy a private intelligence layer to continuously connect data and surface risk patterns.',
    ],
    best: 3,
  },
  {
    id: 'gov2',
    title: 'Scenario 2 — Notice Received from Regulator',
    scenario:
      'A notice arrives from a regulator. The legal team can use a workflow AI tool to summarise the notice and draft an initial response. But the CEO also wants to know: which past internal decisions are implicated, which contracts and teams are exposed, what cash and reputational impact may follow, and whether similar warning signs existed earlier.',
    question: 'What distinguishes the more strategic AI deployment?',
    options: [
      'A system that rapidly analyses the notice and produces a structured legal summary.',
      'A system that converts the notice into an enterprise-wide risk map, links it with internal data, and recommends actions.',
      'A system that provides a comprehensive library of legal prompts, templates, and research workflows.',
      'A system that streamlines coordination with external counsel and tracks response activities efficiently.',
    ],
    best: 1,
  },
  {
    id: 'gov3',
    title: 'Scenario 3 — M&A / Due Diligence Pressure',
    scenario:
      'During a live acquisition, the strategy team needs fast answers on hidden liabilities, change-of-control clauses, regulatory exposure, employee disputes, litigation history, vendor concentration, and governance red flags. The deal team wants AI speed, but the company cannot risk external leakage of deal documents.',
    question: 'What is the best response?',
    options: [
      'Upload deal documents into a public AI platform using aliases and code names.',
      'Rely entirely on manual reviews because AI creates confidentiality concerns.',
      'Run AI-assisted analysis inside a private enterprise environment with restricted access.',
      'Request external counsel to review selected documents and summarize key risks.',
    ],
    best: 2,
  },
  {
    id: 'gov4',
    title: 'Scenario 4 — Whistleblower / Internal Misconduct Review',
    scenario:
      'A whistleblower complaint suggests financial irregularities, contract side letters, policy deviations, and management override of controls. The company needs fast correlation across emails, contracts, approvals, payment records, board papers, and prior complaints — but the matter is extremely confidential.',
    question: 'What is the best path?',
    options: [
      'Allow external advisers to gather information before conducting an internal review.',
      'Use a public AI platform to accelerate document review and analysis.',
      'Use a private AI investigation layer to correlate facts across internal systems.',
      'Assign the matter to a single function (say HR) to conduct an internal assessment.',
    ],
    best: 2,
  },
  {
    id: 'gov5',
    title: 'Scenario 5 — The Regulator Already Connects Your Fragmented Data',
    scenario:
      'Tax authorities, regulators and enforcement agencies increasingly triangulate information across GST filings, income-tax returns, customs data, banking transactions, employee records, vendor networks, e-invoices, public disclosures and third-party databases. Investigations often begin when seemingly unrelated data points reveal hidden patterns, inconsistencies or unexplained transactions.',
    question: 'As a Board member or CXO, how are you ensuring your organization identifies these patterns before an external regulator does?',
    options: [
      'Depend on individual departments to monitor their own data and escalate potential concerns through existing reporting channels.',
      'Conduct periodic audits across key functions and address issues that are identified during scheduled reviews.',
      'Review interconnected data only after receiving a notice, investigation request, whistleblower complaint or similar trigger.',
      'Continuously connect legal, finance, tax, HR, compliance and operational data to identify emerging risk patterns early.',
    ],
    best: 3,
  },
  {
    id: 'gov6',
    title: 'Scenario 6 — Regulatory, Media & Competitive Intelligence',
    scenario:
      "If a competitor's CEO, a regulator, a journalist and an activist investor are all discussing a risk affecting your business on the same day, how long would it take for that information to reach your Board in an actionable form?",
    question: 'What is the best approach?',
    options: [
      'Deploy a continuous intelligence system that monitors regulators, journalists, competitors, industry developments and social media, and provides real-time alerts and actionable insights to decision-makers.',
      'Rely on official circulars, regulatory notifications, legal notices and industry publications, and assess their impact through periodic internal reviews.',
      'Depend on business teams, consultants and external advisers to monitor developments, identify relevant changes and escalate significant issues to management.',
      'Review regulatory, competitive and market developments during scheduled leadership and board meetings, and determine any actions based on those discussions.',
    ],
    best: 0,
  },
  {
    id: 'gov7',
    title: 'Scenario 7 — Litigation and Regulatory Heat',
    scenario:
      'The company is facing multiple notices, departmental queries, and potential disputes across jurisdictions. Management wants one place that can answer: What is the issue, where is the exposure, which contracts are implicated, what are the possible financial consequences, who are the decision-makers, and what immediate actions should be prioritised?',
    question: 'What is the best approach?',
    options: [
      'Deploy a private legal-risk intelligence layer that connects notices, contracts, pleadings, board papers and internal records into decision-ready risk insights.',
      'Depend on periodic updates from external counsel that summarize notices, litigation developments, contracts and major legal matters.',
      'Maintain separate repositories for notices, contracts, litigation records and board materials managed by different teams and advisers.',
      'Restrict sensitive legal information to a small internal group and escalate issues only when specific decisions arise.',
    ],
    best: 0,
  },
  {
    id: 'gov8',
    title: 'Scenario 8 — CXO Time Is Lost in Fragmentation',
    scenario:
      'Every important decision requires someone to chase legal for one answer, finance for another, contracts from procurement, data from compliance, and narrative from strategy. Senior management spends too much time stitching together fragmented information.',
    question: 'What should be done?',
    options: [
      'Establish more cross-functional review committees and increase periodic management reporting.',
      'Build a private enterprise intelligence assistant that connects and analyses information across internal data sources.',
      'Rely on individual business functions to independently identify and escalate emerging risks.',
      'Conduct targeted investigations only after significant issues or concerns have already surfaced.',
    ],
    best: 1,
  },
  {
    id: 'gov9',
    title: 'Scenario 9 — CFO Wants ROI, Not AI Theatre',
    scenario:
      'The CFO is open to AI, but only if it materially improves speed, reduces external advisory spend, shortens internal turnaround times, improves issue visibility, and helps avoid expensive governance surprises.',
    question: 'How should the case be framed?',
    options: [
      'Position AI as a modernity initiative so the company is seen as innovative.',
      'Justify it only on employee productivity and document summarisation.',
      'Tie it to measurable outcomes: faster decisions, reduced confidentiality leaks.',
      'Buy the cheapest tool available and test it informally.',
    ],
    best: 2,
  },
  {
    id: 'gov10',
    title: 'Scenario 10 — Data Residency and Trust',
    scenario:
      'Your business handles promoter-level discussions, board decks, privileged legal analyses, HR investigations, customer escalations, and regulatory correspondence. Leadership is uncomfortable sending such material to public cloud AI systems where model training, retention, or third-party exposure remains unclear.',
    question: 'What is the most defensible direction?',
    options: [
      'Use public AI tools after applying internal redaction and confidentiality safeguards.',
      'Use public AI tools only for low-risk research, drafting and knowledge tasks.',
      'Use a private AI environment operating within company-controlled infrastructure and networks.',
      'Restrict AI use for sensitive matters and rely primarily on manual reviews.',
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
    title: 'Scenario 1 — Sensitive Legal Advice in External AI Workflows',
    scenario:
      'Your legal and compliance teams want faster AI-assisted review of notices, contracts, internal investigations, litigation strategy notes, and board-sensitive legal advice. The workflow tool is built on highly capable external models and appears reputable, but sensitive company information may still move outside your controlled environment.',
    question: 'What matters most?',
    options: [
      'Whether the platform has a strong market reputation and is widely adopted by leading legal teams.',
      'Whether the platform helps lawyers prepare documents, summaries, and analyses more efficiently.',
      "Whether privileged legal information and sensitive reasoning remain within the company's controlled environment.",
      'Whether the platform provides a familiar user experience and integrates smoothly into existing workflows.',
    ],
    best: 2,
  },
  {
    id: 'lva2',
    title: 'Scenario 2 — Legal AI That Stops at Legal',
    scenario:
      'Your team adopts an AI legal workflow assistant that summarises contracts, compares clauses, and helps draft legal language well. But when the CEO asks, "How does this contract risk affect cash flow, insurance coverage, lender covenants, regulatory exposure, and board-level decisions?", the tool cannot connect those dots.',
    question: 'What capability creates greater enterprise value?',
    options: [
      'Faster legal document review and approval processes.',
      'Connected intelligence across legal, finance and compliance functions.',
      'Expanded legal knowledge bases and drafting templates.',
      'Improved tracking of law firms and external advisers.',
    ],
    best: 1,
  },
  {
    id: 'lva3',
    title: 'Scenario 3 — Contract Clause vs Enterprise Consequence',
    scenario:
      'Your legal AI tool flags a change-of-control clause in a major customer agreement. But management still needs to know: whether that triggers lender covenant issues, whether insurance coverage is sufficient, whether revenue concentration risk increases, and whether the Board must be briefed immediately.',
    question: 'What capability is most valuable?',
    options: [
      'AI that improves the accuracy of legal review and issue spotting.',
      'AI that speeds up contract negotiation and approval processes.',
      'AI that connects legal findings to financial, governance, and strategic risks.',
      'AI that creates executive summaries and contract management reports.',
    ],
    best: 2,
  },
  {
    id: 'lva4',
    title: 'Scenario 4 — Vendor Trust vs Architectural Control',
    scenario:
      'A company is considering a reputable AI legal workflow platform for contract and advisory work. The vendor says security is strong and the system is enterprise-grade. However, the GC still worries about where highly sensitive matter context, strategy, and internal legal reasoning sit in practice over time.',
    question: 'What is the more defensible CXO lens?',
    options: [
      'If the vendor is widely trusted and used by leading enterprises, the architecture question becomes less significant.',
      'If external counsel already relies on the platform for sensitive matters, internal adoption should present limited concern.',
      'Since the primary use case relates to legal workflows, the decision should largely remain with the legal team.',
      'Vendor reputation is important, but data architecture, access controls, privilege protection, and intelligence governance are equally critical.',
    ],
    best: 3,
  },
  {
    id: 'lva5',
    title: 'Scenario 5 — Legal Workflow vs Enterprise Risk Intelligence',
    scenario:
      'A legal AI tool helps answer clause-level and matter-level questions very well. But the CFO, CEO, and Board need a system that tells them: where are liabilities clustering, which contracts interact with ongoing disputes, what governance patterns are emerging, and which risks threaten enterprise value.',
    question: 'What is missing?',
    options: [
      'A larger legal operations team reviewing more contracts and legal matters.',
      'A faster document management system with improved search and retrieval capabilities.',
      'An enterprise risk-intelligence layer that connects data across functions and surfaces board-level risk insights.',
      'A broader contract automation platform with additional templates and workflow features.',
    ],
    best: 2,
  },
  {
    id: 'lva6',
    title: 'Scenario 6 — Speed vs Strategic Moat',
    scenario:
      "A high-quality legal AI platform offers quick deployment for contract review and legal drafting. But the company's real moat lies in its internal knowledge: deal history, negotiation behaviour, board decisions, risk appetite, regulator interactions, dispute patterns, and enterprise-specific governance logic.",
    question: 'What should leadership ask?',
    options: [
      'Can the platform improve the speed and efficiency of legal and compliance workflows?',
      'Can the platform generate summaries, reports and insights from large document repositories?',
      'Can the platform support collaboration between management, legal teams and external advisers?',
      'Can the platform continuously learn from enterprise data and create a proprietary governance intelligence layer unique to the organization?',
    ],
    best: 3,
  },
  {
    id: 'lva7',
    title: 'Scenario 7 — Department Tool vs CXO Tool',
    scenario:
      'A legal operations head wants an AI assistant for contract and advisory workflows. The CEO wants a system that can answer: "What should I worry about right now across contracts, litigation, compliance, governance, and strategic exposure?"',
    question: 'Which requirement better matches CXO needs?',
    options: [
      'A document intelligence platform that accelerates contract review and legal drafting workflows.',
      'A workflow automation system that standardises processes through templates, playbooks and approvals.',
      'A private intelligence layer that synthesises enterprise-wide risk into decision-ready insights.',
      'A knowledge management assistant that delivers answers from policies, procedures and internal guidance.',
    ],
    best: 2,
  },
  {
    id: 'lva8',
    title: 'Scenario 8 — External Model Layer vs Internal Strategic Layer',
    scenario:
      "A company is comfortable using highly capable external models for generic reasoning tasks. But it is unsure whether the company's most sensitive legal and governance workflows should depend on those tools directly.",
    question: 'What is the strongest strategic stance?',
    options: [
      'Build legal and compliance workflows primarily on external AI platforms and rely on their security, governance, and access controls.',
      'Use advanced AI models where appropriate, while keeping sensitive data, decision logic, permissions, and orchestration within a controlled enterprise environment.',
      'Restrict the use of AI for legal and compliance matters and continue relying mainly on established internal review processes.',
      'Delegate AI strategy, governance, and implementation decisions entirely to the legal and compliance functions within the organization.',
    ],
    best: 1,
  },
];

const LEGAL_VS_ENTERPRISE_COMPLETION_MESSAGE =
  'Most legal AI tools improve legal workflow. DeRisk.biz is designed to help CXOs convert sensitive legal, financial, compliance, contractual, and governance data into private, decision-ready enterprise intelligence.';

const CONTACT_EMAIL = 'info@derisk.biz';
