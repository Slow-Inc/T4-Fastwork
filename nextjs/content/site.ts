/** Static homepage content: metrics, process schematic, certificates. */

export interface Metric {
  value: string;
  label: string;
}
export const metrics: Metric[] = [
  { value: '20+', label: 'Years combined' },
  { value: '500+', label: 'Projects shipped' },
  { value: '7', label: 'AI & security certs' },
  { value: 'TH·EN', label: 'Bilingual delivery' },
];

// The real request path through a T4 Labs system (Requirement §4.1.7 / §14.11).
export interface ProcessNode {
  index: string;
  name: string;
  role: string;
}
export interface ProcessConn {
  label: string;
}
export const processNodes: ProcessNode[] = [
  { index: '01', name: 'Next.js', role: 'Client' },
  { index: '02', name: 'Cloudflare', role: 'Edge · WAF' },
  { index: '03', name: 'Nest.js', role: 'API' },
  { index: '04', name: 'Supabase', role: 'Postgres · pgvector' },
  { index: '05', name: 'LLM', role: 'AI · RAG' },
];
export const processConns: ProcessConn[] = [
  { label: 'HTTPS' },
  { label: 'route / cache' },
  { label: 'SQL' },
  { label: 'RAG · stream' },
];
export const processSteps = ['Discovery', 'Architecture', 'Build', 'Ship', 'Scale'];

export interface Certificate {
  issuer: string;
  title: string;
}
export const certificates: Certificate[] = [
  { issuer: 'NVIDIA', title: 'AI for All: From Basics to GenAI Practice' },
  { issuer: 'Coursera', title: 'GenAI for Application Developers' },
  { issuer: 'SET', title: 'Entrepreneurial Mindset' },
  { issuer: 'Microsoft · JA', title: 'Road to Data Scientists' },
  { issuer: 'SIIT · TU', title: 'Basic Data Analytics Workshop' },
  { issuer: 'TDGA', title: 'Cyber Security Awareness' },
  { issuer: 'TDGA', title: 'AI Governance & Ethics' },
];
