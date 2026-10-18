import { type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ProjectZipUpload } from '@/components/project-zip-upload';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { Activity, ArrowDownToLine, ArrowLeft, ArrowRight, Check, Clipboard, FileArchive, FileText, FolderTree, Info, Layers3, LockKeyhole, Search, ShieldCheck, Sparkles, Wrench, Zap } from 'lucide-react';
import JSZip from 'jszip';
import { applyProjectName, buildChangelogTemplate, buildPackReadme, buildReadmeDraft, buildStructureSummary, createDocs, emptyMeta, formatJson, formatMarkdown, markdownToSafeHtml, starterInstallationGuide, starterOnboardingGuide, starterReadme, textStats, type ProjectMeta, makeGitignore } from './lib/docu';

const queryClient = new QueryClient();

function Header() {
  return <header className="wrap topbar">
    <Link href="/" className="brand" data-testid="link-home-brand"><span className="brand-mark"><Zap size={20} fill="currentColor" /></span><span>Docu-Flow</span><span className="ai-badge" title="Product name only; no AI model is used." aria-label="AI is a product label. No AI model is used.">AI</span></Link>
    <Link href="/" className="top-link" data-testid="link-free-tools">Free tools</Link>
  </header>;
}
function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <span>Made for the work before the work. Runs in your browser.</span>
        <nav aria-label="Footer navigation">
          <Link href="/about" data-testid="link-about">About</Link>
          <Link href="/privacy" data-testid="link-privacy">Privacy</Link>
          <a href="mailto:?subject=Docu-Flow%20feedback" data-testid="link-feedback" aria-label="Open an email draft for feedback">Feedback</a>
          <a href="https://buymeacoffee.com" target="_blank" rel="noopener noreferrer" data-testid="link-coffee" style={{ marginLeft: '12px' }}>Buy me a coffee</a>
        </nav>
      </div>
    </footer>
  );
}
function Layout({ children }: { children: ReactNode }) {
  return <div className="shell"><Header /><main className="wrap">{children}</main><Footer /></div>;
}
function PageTitle({ kicker, title, description }: { kicker: string; title: string; description: string }) {
  return <div className="page-heading"><div className="eyebrow">{kicker}</div><h1>{title}</h1><p>{description}</p></div>;
}
function BackHome() { return <Link href="/" className="btn btn-quiet" data-testid="link-return-home"><ArrowLeft size={15} /> All tools</Link>; }
function downloadText(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}
function ToastLine({ message, error = false }: { message: string; error?: boolean }) {
  return message ? <div className={`status ${error ? 'error' : ''}`} role="status" data-testid="status-message">{message}</div> : null;
}
const toolItems = [
  { title: 'README Studio', desc: 'Draft a clear README, shape the details, and preview the Markdown as you go.', href: '/readme-studio', icon: FileText, tag: 'WRITE' },
  { title: 'Project Analyzer', desc: 'Inspect a small project ZIP locally. Get a readable inventory, not a security scan.', href: '/project-analyzer', icon: Activity, tag: 'INSPECT' },
  { title: 'Developer Utilities', desc: 'Tidy JSON, create ignore files, format Markdown, and get quick text stats.', href: '/developer-utilities', icon: Wrench, tag: 'UTILITY' },
  { title: 'Documentation Pack', desc: 'Bring your docs together in one editable, downloadable starter pack.', href: '/documentation-pack', icon: Layers3, tag: 'BUNDLE' },
];
function Home() {
  const [search, setSearch] = useState('');
  const shown = useMemo(() => toolItems.filter((item) => `${item.title} ${item.desc}`.toLowerCase().includes(search.toLowerCase())), [search]);
  return (
    <Layout><section className="page-heading" style={{ paddingTop: 68 }}>
        <h1
          data-testid="text-home-headline"
          style={{ fontSize:'clamp(44px,7vw,74px)',maxWidth:800,marginTop:18 }}
          className="font-normal text-[65px]">Everything your project needs.</h1>
        <p style={{ fontSize:16,maxWidth:610 }}>Useful project docs and small developer tools, without accounts, setup, or uploads. Your work stays right here in your browser.</p>
        <div className="search-wrap"><Search size={18} /><input className="field" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search developer tools..." aria-label="Search developer tools..." data-testid="input-tool-search" /></div>
      </section>
      <section aria-label="Documentation tools" style={{ marginTop:6 }}><h2 style={{ fontSize:19,letterSpacing:'-.03em',margin:'0 0 15px' }}>Documentation</h2></section>
      <section aria-label="Developer tools" className="tool-grid" data-testid="grid-tools">{shown.map(({ title, desc, href, icon: Icon, tag }) => <Link key={href} href={href} className="panel tool-card" data-testid={`card-tool-${href.slice(1)}`}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}><span className="icon-tile"><Icon size={20} /></span><span className="eyebrow" style={{ fontSize:9,color:'#91a2b2' }}>{tag}</span></div><h2>{title}</h2><p>{desc}</p><ArrowRight className="tool-arrow" size={17} />
      </Link>)}</section>
      {shown.length === 0 && <div className="panel" style={{ marginTop:16,padding:24 }} data-testid="empty-search"><strong>No matching tools.</strong><p style={{ color:'#9dacbb',fontSize:13 }}>Try “docs”, “JSON”, or “project”.</p></div>}
      <section className="panel" style={{ padding:'22px 24px',margin:'24px 0 44px',display:'flex',gap:16,alignItems:'flex-start' }}><span className="icon-tile" style={{ flexShrink:0 }}><LockKeyhole size={18}/></span><div><strong style={{ fontSize:13 }}>Private by design.</strong><p style={{ color:'#9dacbb',fontSize:12,lineHeight:1.7,margin:'5px 0 0' }}>Files are read locally for the task you choose. Nothing is sent to a server, and uploaded source is never executed.</p></div></section>
    </Layout>
  );
}

function SourcePill({ value }: { value: string }) {
  return <span className="source-pill">{value}</span>;
}
function fieldSource(value: string, detectedValue: string | undefined, source: string | undefined) {
  if (source && value.trim() === (detectedValue || '').trim()) return `Detected · ${source}`;
  if (value.trim()) return detectedValue ? 'Edited by you' : 'Provided by you';
  return 'Not provided';
}
function ReadmeStudio({ sharedMeta, onAnalyzed }: { sharedMeta: ProjectMeta | null; onAnalyzed: (meta: ProjectMeta) => void }) {
  const [name, setName] = useState(sharedMeta?.projectName || '');
  const [description, setDescription] = useState(sharedMeta?.description || '');
  const [problem, setProblem] = useState('');
  const [features, setFeatures] = useState('');
  const [technologies, setTechnologies] = useState(sharedMeta?.technologies.join(', ') || '');
  const [installation, setInstallation] = useState('');
  const [usage, setUsage] = useState('');
  const [projectStatus, setProjectStatus] = useState('');
  const [license, setLicense] = useState(sharedMeta?.license || '');
  const [authorLinks, setAuthorLinks] = useState([sharedMeta?.author, sharedMeta?.repository].filter(Boolean).join(' · '));
  const [markdown, setMarkdown] = useState(() => sharedMeta?.readmeFiles[0]?.content || (sharedMeta?.origin === 'zip' ? buildReadmeDraft(sharedMeta, {}) : starterReadme));
  const [selectedReadme, setSelectedReadme] = useState(sharedMeta?.readmeFiles[0]?.path || '');
  const [tab, setTab] = useState<'edit'|'preview'>('edit');
  const [message, setMessage] = useState('');
  const [optionalOpen, setOptionalOpen] = useState(false);
  const draftMeta = useMemo<ProjectMeta>(() => {
    const detected = sharedMeta || emptyMeta(name);
    const detectedAuthorLinks = [detected.author, detected.repository].filter(Boolean).join(' · ');
    return {
      ...detected,
      projectName: name.trim() || detected.projectName || 'Project name',
      description: description.trim() || undefined,
      technologies: technologies.trim() ? technologies.split(',').map((item) => item.trim()).filter(Boolean) : detected.technologies,
      license: license.trim() || undefined,
      author: authorLinks.trim() || detected.author,
      sources: {
        ...detected.sources,
        projectName: !name.trim() || name.trim() === detected.projectName ? detected.sources.projectName : 'your input',
        description: description.trim() === (detected.description || '').trim() ? detected.sources.description : description.trim() ? 'your input' : undefined,
        technologies: !technologies.trim() || technologies.trim() === detected.technologies.join(', ') ? detected.sources.technologies : 'your input',
        license: !license.trim() || license.trim() === (detected.license || '') ? detected.sources.license : 'your input',
        author: !authorLinks.trim() || authorLinks.trim() === detectedAuthorLinks ? (detected.sources.author || detected.sources.repository) : 'your input',
      },
    };
  }, [sharedMeta, name, description, technologies, license, authorLinks]);
  const generated = useMemo(() => buildReadmeDraft(draftMeta, {
    projectName: name,
    description,
    problem,
    features,
    technologies,
    installation,
    usage,
    projectStatus,
    license,
    authorLinks,
  }), [draftMeta, name, description, problem, features, technologies, installation, usage, projectStatus, license, authorLinks]);
  const act = async (fn: () => Promise<void>, success: string) => { try { await fn(); setMessage(success); } catch { setMessage('Clipboard access is unavailable. You can still select and copy the Markdown.'); } };
  function handleAnalyzed(meta: ProjectMeta) {
    onAnalyzed(meta);
    setName(meta.projectName);
    setDescription(meta.description || '');
    setTechnologies(meta.technologies.join(', '));
    setLicense(meta.license || '');
    setAuthorLinks([meta.author, meta.repository].filter(Boolean).join(' · '));
    const firstReadme = meta.readmeFiles[0];
    setSelectedReadme(firstReadme?.path || '');
    setMarkdown(firstReadme?.content || buildReadmeDraft(meta, {
      projectName: meta.projectName,
      description: meta.description,
      technologies: meta.technologies.join(', '),
      license: meta.license,
      authorLinks: [meta.author, meta.repository].filter(Boolean).join(' · '),
      problem,
      features,
      installation,
      usage,
      projectStatus,
    }));
    setTab('edit');
    setMessage('Project analyzed locally. Detected details are labeled by source; missing facts remain prompts.');
  }
  function loadReadme(path: string) {
    const readme = sharedMeta?.readmeFiles.find((entry) => entry.path === path);
    if (!readme) return;
    setSelectedReadme(path);
    setMarkdown(readme.content);
    setTab('edit');
    setMessage(`Loaded existing README from ${path}.`);
  }
  function generateDraft() {
    if (sharedMeta?.origin !== 'zip' && (!name.trim() || !description.trim())) {
      setMessage('For a manual draft, enter a project name and short description, or upload a ZIP to prefill details.');
      return;
    }
    setMarkdown(generated);
    setTab('edit');
    setMessage('Editable README draft generated from detected details and your input.');
  }
  return (
    <Layout><PageTitle kicker="DOCUMENTATION / 01" title="README Studio" description="Start with your project ZIP, or enter a name and short description to create a manual draft." />
      <div style={{ display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:16 }}><BackHome/></div>
      <div style={{ marginBottom:16 }}><ProjectZipUpload onAnalyzed={handleAnalyzed} testIdPrefix="readme-zip" title="Upload a project ZIP" /></div>
      <div className="notice" style={{ marginBottom:16 }}>
        {sharedMeta?.origin === 'zip'
          ? `Detected project metadata is available for this session. ${selectedReadme ? `Existing README loaded from ${selectedReadme}.` : 'No existing README was found; the editor contains a metadata-based draft with prompts for missing facts.'}`
          : 'Alternative: create manually below. Enter only the project name and short description; other details are optional.'}
        {sharedMeta?.readmeFiles.length ? <label className="readme-picker-label" htmlFor="readme-source-select">Choose an existing README to edit
          <select id="readme-source-select" className="field" value={selectedReadme} onChange={(event) => loadReadme(event.target.value)} data-testid="select-readme-source">
            {sharedMeta.readmeFiles.map((item) => <option key={item.path} value={item.path}>{item.path}</option>)}
          </select>
        </label> : null}
      </div>
      <div style={{ display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:16 }}>
        <button className="btn btn-quiet" onClick={() => { setName('');setDescription('');setProblem('');setFeatures('');setTechnologies('');setInstallation('');setUsage('');setProjectStatus('');setLicense('');setAuthorLinks('');setSelectedReadme('');setMarkdown(starterReadme);setMessage('Template loaded. Enter a project name and short description to create a manual draft.'); }} data-testid="button-readme-sample"><Sparkles size={15}/> Load template</button>
        <button className="btn btn-quiet" onClick={generateDraft} data-testid="button-readme-generate"><FileText size={15}/> Generate draft</button>
        <button className="btn btn-quiet" onClick={() => void act(() => copyText(markdown), 'Markdown copied.')} data-testid="button-readme-copy"><Clipboard size={15}/> Copy</button>
        <button className="btn btn-primary" onClick={() => downloadText(`${(name.trim() || 'README').replace(/[^\w-]+/g,'-')}.md`,markdown)} data-testid="button-readme-download"><ArrowDownToLine size={15}/> Download README.md</button>
        <ToastLine message={message}/>
      </div>
      <div className="split">
        <section className="panel" style={{ padding:20 }}>
          <div className="eyebrow" style={{ marginBottom:15 }}>OR CREATE MANUALLY</div>
          <label className="field-label" htmlFor="readme-name">Project name · required for manual draft <SourcePill value={fieldSource(name, sharedMeta?.projectName, sharedMeta?.sources.projectName)} /></label>
          <input id="readme-name" className="field" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. orbit-notes" data-testid="input-readme-name"/>
          <label className="field-label" htmlFor="readme-desc" style={{ marginTop:16 }}>Short description · required for manual draft <SourcePill value={fieldSource(description, sharedMeta?.description, sharedMeta?.sources.description)} /></label>
          <textarea id="readme-desc" className="field" rows={3} value={description} onChange={e=>setDescription(e.target.value)} placeholder="One sentence about what it does" data-testid="input-readme-description"/>
          <details className="optional-details" open={optionalOpen} onToggle={(event) => setOptionalOpen(event.currentTarget.open)} data-testid="details-readme-optional">
            <summary>Optional details · features, technologies, setup, and more</summary>
            <div className="optional-details-content">
              <label className="field-label" htmlFor="readme-problem">Problem it solves</label><textarea id="readme-problem" className="field" rows={3} value={problem} onChange={e=>setProblem(e.target.value)} placeholder="Optional — describe the problem this project addresses" data-testid="input-readme-problem"/>
              <label className="field-label" htmlFor="readme-features" style={{ marginTop:16 }}>Features, one per line</label><textarea id="readme-features" className="field" rows={3} value={features} onChange={e=>setFeatures(e.target.value)} placeholder="Optional — list capabilities you have verified" data-testid="input-readme-features"/>
              <label className="field-label" htmlFor="readme-technologies" style={{ marginTop:16 }}>Technologies <SourcePill value={fieldSource(technologies, sharedMeta?.technologies.join(', '), sharedMeta?.sources.technologies)} /></label><input id="readme-technologies" className="field" value={technologies} onChange={e=>setTechnologies(e.target.value)} placeholder="Optional — detected technologies are prefilled" data-testid="input-readme-technologies"/>
              <label className="field-label" htmlFor="readme-installation" style={{ marginTop:16 }}>Installation instructions</label><textarea id="readme-installation" className="field code" rows={3} value={installation} onChange={e=>setInstallation(e.target.value)} placeholder="Optional — add steps you have tested" data-testid="input-readme-installation"/>
              <label className="field-label" htmlFor="readme-usage" style={{ marginTop:16 }}>Usage instructions</label><textarea id="readme-usage" className="field" rows={3} value={usage} onChange={e=>setUsage(e.target.value)} placeholder="Optional — describe actual project usage" data-testid="input-readme-usage"/>
              <label className="field-label" htmlFor="readme-status" style={{ marginTop:16 }}>Project status</label><input id="readme-status" className="field" value={projectStatus} onChange={e=>setProjectStatus(e.target.value)} placeholder="Optional — e.g. In development" data-testid="input-readme-status"/>
              <label className="field-label" htmlFor="readme-license" style={{ marginTop:16 }}>License <SourcePill value={fieldSource(license, sharedMeta?.license, sharedMeta?.sources.license)} /></label><input id="readme-license" className="field" value={license} onChange={e=>setLicense(e.target.value)} placeholder="Optional — detected license is prefilled when available" data-testid="input-readme-license"/>
              <label className="field-label" htmlFor="readme-author" style={{ marginTop:16 }}>Author or project links <SourcePill value={fieldSource(authorLinks, [sharedMeta?.author, sharedMeta?.repository].filter(Boolean).join(' · '), sharedMeta?.sources.author || sharedMeta?.sources.repository)} /></label><input id="readme-author" className="field" value={authorLinks} onChange={e=>setAuthorLinks(e.target.value)} placeholder="Optional — name, repository, or website" data-testid="input-readme-author"/>
            </div>
          </details>
          <div className="notice" style={{ marginTop:16 }}>Detected details carry a source label; your edits are marked as provided by you. Bracketed text is a template prompt. No commands or features are invented.</div>
        </section>
        <section className="panel" style={{ padding:20 }}>
          <div style={{ display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:14 }}><div className="eyebrow">README.MD · {sharedMeta?.sources.readme ? `SOURCE: ${selectedReadme || sharedMeta.sources.readme}` : sharedMeta?.origin === 'zip' ? 'DRAFT' : 'MANUAL / TEMPLATE'}</div><div className="tab-row"><button className="tab" aria-selected={tab==='edit'} onClick={()=>setTab('edit')} data-testid="tab-readme-edit">Edit</button><button className="tab" aria-selected={tab==='preview'} onClick={()=>setTab('preview')} data-testid="tab-readme-preview">Preview</button></div></div>
          {tab==='edit' ? <textarea className="field code" style={{ minHeight:500,resize:'vertical' }} aria-label="Edit README Markdown" value={markdown} onChange={e=>setMarkdown(e.target.value)} data-testid="textarea-readme-markdown"/> : <div className="prose-preview" style={{ minHeight:500 }} dangerouslySetInnerHTML={{ __html:markdownToSafeHtml(markdown) }} data-testid="preview-readme-markdown"/>}
        </section>
      </div>
    </Layout>
  );
}

function ProjectAnalyzer({ sharedMeta, onAnalyzed }: { sharedMeta: ProjectMeta | null; onAnalyzed: (meta: ProjectMeta) => void }) {
  const [analysisMeta, setAnalysisMeta] = useState<ProjectMeta | null>(sharedMeta?.origin === 'zip' ? sharedMeta : null);
  const [customName, setCustomName] = useState(sharedMeta?.sources.projectName === 'your input' ? sharedMeta.projectName : '');
  const result = useMemo(() => analysisMeta ? applyProjectName(analysisMeta, customName) : null, [analysisMeta, customName]);
  function handleAnalyzed(meta: ProjectMeta) {
    setAnalysisMeta(meta);
    onAnalyzed(applyProjectName(meta, customName));
  }
  return <Layout><PageTitle kicker="PROJECT INSPECTION / 02" title="Project Analyzer" description="Get a small, readable project inventory from a ZIP. The archive is inspected locally; source files are never run."/>
    <div style={{ display:'flex',gap:10,marginBottom:16 }}><BackHome/><Link href="/documentation-pack" className="btn btn-quiet" data-testid="link-analyzer-docs">Open documentation pack <ArrowRight size={15}/></Link></div>
    <div style={{ marginBottom:12 }}><label className="field-label" htmlFor="analyzer-custom-name">Custom project name (optional)</label><input className="field" id="analyzer-custom-name" value={customName} onChange={event=>{const value=event.target.value;setCustomName(value);if(analysisMeta)onAnalyzed(applyProjectName(analysisMeta,value));}} placeholder="Uses detected project name when blank" data-testid="input-analyzer-project-name"/><div className="notice" style={{ marginTop:8 }}>Leave blank to use detected metadata, then the ZIP’s root folder name.</div></div>
    <ProjectZipUpload onAnalyzed={handleAnalyzed} testIdPrefix="analyzer-zip" title="Choose a project ZIP to inspect" description="The archive is read only in your browser. Nothing is uploaded, and source files are never executed." />
    <div className="notice" style={{ marginTop:12 }}>We skip node_modules, dist, build, .git, unsupported formats, and text files over 256 KB. The inventory is approximate and is not a security scan.</div>
    {result && <section style={{ marginTop:20 }} data-testid="section-analysis-results">
      <div style={{ display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:14,flexWrap:'wrap' }}><div><div className="eyebrow">LOCAL INVENTORY · REUSED THIS SESSION</div><h2 style={{ margin:'7px 0 0',letterSpacing:'-.04em' }} data-testid="text-analysis-project">{result.projectName || 'Unnamed project'}</h2></div><button className="btn btn-quiet" onClick={()=>downloadText('project-analysis.txt',analysisReport(result))} data-testid="button-analysis-download"><ArrowDownToLine size={15}/> Download summary</button></div>
      <div className="tool-grid" style={{ marginBottom:16 }}><div className="stat-box"><strong data-testid="text-analysis-filecount">{result.fileCount}</strong><span>supported text files</span></div><div className="stat-box"><strong data-testid="text-analysis-lines">{result.lineEstimate.toLocaleString()}</strong><span>estimated lines</span></div></div>
      <div className="split"><section className="panel" style={{ padding:20 }}><h3 style={{ marginTop:0,fontSize:14 }}>Detected project details</h3><p style={{ color:'#9dacbb',fontSize:13 }}>{result.technologies.length ? result.technologies.join(' · ') : 'No technologies identified from supported files.'}{result.sources.technologies ? ` · ${result.sources.technologies}` : ''}</p>{result.packageName && <p className="code" style={{ color:'#c7d7e4' }}>{result.packageName}{result.description?` — ${result.description}`:''} {result.sources.projectName ? `(${result.sources.projectName})` : ''}</p>}{result.license && <p style={{ color:'#c7d7e4',fontSize:12 }}>License: {result.license} · {result.sources.license}</p>}{result.author && <p style={{ color:'#c7d7e4',fontSize:12 }}>Author: {result.author} · {result.sources.author}</p>}{result.repository && <p style={{ color:'#c7d7e4',fontSize:12,overflowWrap:'anywhere' }}>Repository: {result.repository} · {result.sources.repository}</p>}<ListBlock title="Dependencies" items={result.dependencies}/><ListBlock title="Development dependencies" items={result.devDependencies}/><ListBlock title="Package scripts" items={Object.entries(result.scripts).map(([k,v])=>`${k}: ${v}`)}/><ListBlock title="Existing README files" items={result.readmeFiles.map((item)=>item.path)}/></section>
      <section className="panel" style={{ padding:20 }}><h3 style={{ marginTop:0,fontSize:14,display:'flex',gap:8,alignItems:'center' }}><FolderTree size={16} color="#62d9ea"/> Simplified file tree</h3><pre className="code" style={{ color:'#bbcad8',whiteSpace:'pre-wrap',maxHeight:350,overflow:'auto' }} data-testid="text-analysis-tree">{result.tree.length ? result.tree.map(p=>`├─ ${p}`).join('\n') : 'No supported files found.'}</pre></section></div>
      {result.notes.map((note,i)=><div className="notice" key={i} style={{ marginTop:10 }} data-testid={`notice-analysis-${i}`}>{note}</div>)}
      <div style={{ display:'flex',gap:10,flexWrap:'wrap',marginTop:16 }}>
        <Link href="/readme-studio" className="btn btn-primary" data-testid="link-analysis-readme"><FileText size={15}/> Generate README</Link>
        <Link href="/documentation-pack" className="btn btn-quiet" data-testid="link-analysis-pack"><Layers3 size={15}/> Create Documentation Pack</Link>
      </div>
    </section>}
  </Layout>;
}
function ListBlock({ title, items }: { title:string;items:string[] }) {
  return <div style={{ marginTop:13 }}><div style={{ fontSize:11,fontWeight:800,color:'#93a5b7',marginBottom:5 }}>{title}</div><div className="code" style={{ color:'#c9d5df',overflowWrap:'anywhere' }}>{items.length?items.join(', '):'None detected'}</div></div>;
}
function analysisReport(meta: ProjectMeta) {
  return `PROJECT INVENTORY: ${meta.projectName}\n\nOrigin: Local ZIP inspection\nProject name source: ${meta.sources.projectName || 'Not identified'}\nDescription: ${meta.description || 'Not detected'}${meta.sources.description ? ` (${meta.sources.description})` : ''}\nLicense: ${meta.license || 'Not detected'}\nAuthor: ${meta.author || 'Not detected'}\nRepository: ${meta.repository || 'Not detected'}\nSupported text files: ${meta.fileCount}\nEstimated lines: ${meta.lineEstimate}\nTechnologies identified from files: ${meta.technologies.join(', ') || 'None identified'}\n\nDependencies: ${meta.dependencies.join(', ') || 'None detected'}\nDevelopment dependencies: ${meta.devDependencies.join(', ') || 'None detected'}\nScripts: ${Object.entries(meta.scripts).map(([k,v])=>`${k}: ${v}`).join(', ') || 'None detected'}\nExisting README files: ${meta.readmeFiles.map((readme) => readme.path).join(', ') || 'None detected'}\n\nSimplified file tree:\n${meta.tree.join('\n') || 'No supported files found.'}\n\n${meta.notes.join('\n')}`;
}

function Utilities() {
  const [tool,setTool]=useState<'json'|'gitignore'|'markdown'|'changelog'|'stats'>('json');
  const [json,setJson]=useState('{\n  "name": "my-project",\n  "ready": true\n}');
  const [jsonOutput,setJsonOutput]=useState('');
  const [jsonError,setJsonError]=useState('');
  const [language,setLanguage]=useState('Node');
  const [framework,setFramework]=useState('No framework');
  const [md,setMd]=useState('# A title\n\n- first item\n* second item\n\nA sentence.   ');
  const [mdOut,setMdOut]=useState('');
  const [project,setProject]=useState('');
  const [statsText,setStatsText]=useState('');
  const [notice,setNotice]=useState('');
  const tabs=[['json','JSON formatter'],['gitignore','.gitignore'],['markdown','Markdown tidy'],['changelog','Changelog'],['stats','Text stats']] as const;
  const outputGit=makeGitignore(language,framework);
  const stat=textStats(statsText);
  const resultAction=(text:string,name:string)=>{downloadText(name,text);setNotice('Download ready.');};
  function resetCurrentUtility() {
    setNotice('');
    setJsonError('');
    if (tool === 'json') { setJson('{\n  "name": "my-project",\n  "ready": true\n}'); setJsonOutput(''); }
    if (tool === 'gitignore') { setLanguage('Node'); setFramework('No framework'); }
    if (tool === 'markdown') { setMd('# A title\n\n- first item\n* second item\n\nA sentence.   '); setMdOut(''); }
    if (tool === 'changelog') setProject('');
    if (tool === 'stats') setStatsText('');
    setNotice('This utility was reset.');
  }
  return <Layout><PageTitle kicker="SMALL TOOLS / 03" title="Developer Utilities" description="Fast, focused helpers for everyday project work. Everything runs in this page; nothing is submitted."/>
    <div style={{ display:'flex',gap:12,alignItems:'center',marginBottom:16,flexWrap:'wrap' }}><BackHome/><span style={{ color:'#91a2b3',fontSize:12,flex:1 }}>Five practical utilities · no setup</span><button className="btn btn-quiet" onClick={resetCurrentUtility} data-testid="button-utility-reset">Reset this utility</button></div>
    <div className="tab-row" role="tablist" style={{ marginBottom:16 }}>{tabs.map(([id,label])=><button key={id} className="tab" role="tab" aria-selected={tool===id} onClick={()=>{setTool(id);setNotice('');}} data-testid={`tab-utility-${id}`}>{label}</button>)}</div>
    <section className="panel" style={{ padding:22 }} data-testid={`panel-utility-${tool}`}>
      {tool==='json'&&<><h2 style={{ fontSize:19,marginTop:0 }}>JSON validator & formatter</h2><p style={{ color:'#9dacbb',fontSize:12 }}>Validate by parsing, then format with two-space indentation.</p><div className="split"><div><label className="field-label" htmlFor="utility-json">JSON input</label><textarea id="utility-json" className="field code" rows={14} value={json} onChange={e=>setJson(e.target.value)} data-testid="textarea-json-input"/></div><div><div className="field-label">Formatted output</div><textarea className="field code" rows={14} value={jsonOutput} readOnly placeholder="Formatted JSON will appear here." aria-label="Formatted JSON output" data-testid="textarea-json-output"/></div></div><div style={{ display:'flex',gap:12,marginTop:14,alignItems:'center',flexWrap:'wrap' }}><button className="btn btn-primary" onClick={()=>{const r=formatJson(json);setJsonOutput(r.output||'');setJsonError(r.error||'');setNotice(r.output?'Valid JSON. Formatted locally.':'');}} data-testid="button-json-format"><Check size={15}/> Validate & format</button><button className="btn btn-quiet" disabled={!jsonOutput} onClick={()=>void copyText(jsonOutput).then(()=>setNotice('Formatted JSON copied.')).catch(()=>setNotice('Clipboard access is unavailable.'))} data-testid="button-json-copy"><Clipboard size={15}/> Copy output</button><button className="btn btn-quiet" disabled={!jsonOutput} onClick={()=>resultAction(jsonOutput,'formatted.json')} data-testid="button-json-download"><ArrowDownToLine size={15}/> Download</button><ToastLine message={jsonError} error/><ToastLine message={notice}/></div></>}
      {tool==='gitignore'&&<><h2 style={{ fontSize:19,marginTop:0 }}>.gitignore generator</h2><p style={{ color:'#9dacbb',fontSize:12 }}>Select a language and framework to combine common ignore patterns.</p><div className="split"><div><label className="field-label" htmlFor="git-language">Language</label><select className="field" id="git-language" value={language} onChange={e=>setLanguage(e.target.value)} data-testid="select-gitignore-language">{['Node','Python','Java','Go','Rust'].map(x=><option key={x}>{x}</option>)}</select><label className="field-label" htmlFor="git-framework" style={{ marginTop:15 }}>Framework / build tool</label><select className="field" id="git-framework" value={framework} onChange={e=>setFramework(e.target.value)} data-testid="select-gitignore-framework">{['No framework','Vite','Next','React','Django','Flask'].map(x=><option key={x}>{x}</option>)}</select></div><textarea className="field code" rows={13} readOnly value={outputGit} aria-label="Generated gitignore" data-testid="textarea-gitignore-output"/></div><div style={{ display:'flex',gap:10,marginTop:14 }}><button className="btn btn-primary" onClick={()=>resultAction(outputGit,'.gitignore')} data-testid="button-gitignore-download"><ArrowDownToLine size={15}/> Download .gitignore</button><button className="btn btn-quiet" onClick={()=>void copyText(outputGit).then(()=>setNotice('Copied to clipboard.')).catch(()=>setNotice('Clipboard unavailable.'))} data-testid="button-gitignore-copy"><Clipboard size={15}/> Copy</button><ToastLine message={notice}/></div></>}
      {tool==='markdown'&&<><h2 style={{ fontSize:19,marginTop:0 }}>Safe Markdown formatter</h2><p style={{ color:'#9dacbb',fontSize:12 }}>Normalize whitespace and unordered list markers. Fenced code blocks are preserved and no HTML is rendered.</p><div className="split"><div><label className="field-label" htmlFor="markdown-input">Markdown</label><textarea className="field code" rows={14} id="markdown-input" value={md} onChange={e=>setMd(e.target.value)} data-testid="textarea-utility-markdown"/></div><div><div className="field-label">Tidied result</div><textarea className="field code" rows={14} readOnly value={mdOut} placeholder="Formatted Markdown will appear here." aria-label="Formatted Markdown result" data-testid="textarea-utility-markdown-output"/></div></div><div style={{ display:'flex',gap:10,marginTop:14,alignItems:'center',flexWrap:'wrap' }}><button className="btn btn-primary" onClick={()=>{setMdOut(formatMarkdown(md));setNotice('Markdown tidied.');}} data-testid="button-markdown-format"><Check size={15}/> Tidy Markdown</button><button className="btn btn-quiet" onClick={()=>void copyText(mdOut||formatMarkdown(md)).then(()=>setNotice('Markdown copied.')).catch(()=>setNotice('Clipboard access is unavailable.'))} data-testid="button-markdown-copy"><Clipboard size={15}/> Copy</button><button className="btn btn-quiet" onClick={()=>resultAction(mdOut||formatMarkdown(md),'formatted.md')} data-testid="button-markdown-download"><ArrowDownToLine size={15}/> Download</button><ToastLine message={notice}/></div></>}
      {tool==='changelog'&&<><h2 style={{ fontSize:19,marginTop:0 }}>Changelog template</h2><p style={{ color:'#9dacbb',fontSize:12 }}>A simple Unreleased section with space to record your own changes.</p><label className="field-label" htmlFor="changelog-name">Project name (optional)</label><input id="changelog-name" className="field" value={project} onChange={e=>setProject(e.target.value)} placeholder="Project name" data-testid="input-changelog-name"/><pre className="field code" style={{ whiteSpace:'pre-wrap',marginTop:15 }} data-testid="text-changelog-template">{buildChangelogTemplate(project)}</pre><div style={{ display:'flex',gap:10,alignItems:'center',flexWrap:'wrap' }}><button className="btn btn-quiet" onClick={()=>void copyText(buildChangelogTemplate(project)).then(()=>setNotice('Changelog template copied.')).catch(()=>setNotice('Clipboard access is unavailable.'))} data-testid="button-changelog-copy"><Clipboard size={15}/> Copy</button><button className="btn btn-primary" onClick={()=>resultAction(buildChangelogTemplate(project),'CHANGELOG.md')} data-testid="button-changelog-download"><ArrowDownToLine size={15}/> Download template</button><ToastLine message={notice}/></div></>}
      {tool==='stats'&&<><h2 style={{ fontSize:19,marginTop:0 }}>Text statistics</h2><p style={{ color:'#9dacbb',fontSize:12 }}>A quick count for text in your browser. No text is sent anywhere.</p><label className="field-label" htmlFor="stats-input">Paste or type text</label><textarea id="stats-input" className="field" rows={9} value={statsText} onChange={e=>setStatsText(e.target.value)} placeholder="Start typing…" data-testid="textarea-stats-input"/><div className="tool-grid" style={{ marginTop:14 }}><div className="stat-box"><strong data-testid="text-stat-words">{stat.words}</strong><span>words</span></div><div className="stat-box"><strong data-testid="text-stat-characters">{stat.characters}</strong><span>characters</span></div><div className="stat-box"><strong data-testid="text-stat-lines">{stat.lines}</strong><span>lines</span></div><div className="stat-box"><strong data-testid="text-stat-blank-lines">{stat.blankLines}</strong><span>blank lines</span></div><div className="stat-box"><strong data-testid="text-stat-reading">{stat.readingMinutes} min</strong><span>estimated reading time</span></div></div><button className="btn btn-quiet" style={{ marginTop:14 }} onClick={()=>void copyText(`Words: ${stat.words}\nCharacters: ${stat.characters}\nLines: ${stat.lines}\nBlank lines: ${stat.blankLines}`).then(()=>setNotice('Text statistics copied.')).catch(()=>setNotice('Clipboard access is unavailable.'))} data-testid="button-stats-copy"><Clipboard size={15}/> Copy statistics</button><ToastLine message={notice}/></>}
    </section>
  </Layout>;
}

function DocumentationPack({ sharedMeta, onAnalyzed }: { sharedMeta: ProjectMeta | null; onAnalyzed: (meta: ProjectMeta) => void }) {
  const [name,setName]=useState(sharedMeta?.projectName||'');
  const [description,setDescription]=useState(sharedMeta?.description||'');
  const [deps,setDeps]=useState(sharedMeta?.dependencies.join(', ')||'');
  const [devDeps,setDevDeps]=useState(sharedMeta?.devDependencies.join(', ')||'');
  const [readme,setReadme]=useState(()=>buildPackReadme(sharedMeta||emptyMeta()));
  const [selectedReadme,setSelectedReadme]=useState(sharedMeta?.readmeFiles[0]?.path||'');
  const [install,setInstall]=useState(starterInstallationGuide);
  const [gettingStarted,setGettingStarted]=useState(starterOnboardingGuide);
  const [structure,setStructure]=useState(()=>buildStructureSummary(sharedMeta||emptyMeta()));
  const [message,setMessage]=useState('');
  const [preview,setPreview]=useState(false);
  const meta=useMemo<ProjectMeta>(()=> {
    const detected=sharedMeta||emptyMeta(name);
    const dependencies=deps.split(',').map(x=>x.trim()).filter(Boolean);
    const devDependencies=devDeps.split(',').map(x=>x.trim()).filter(Boolean);
    return {
      ...detected,
      projectName:name.trim()||detected.projectName||'Untitled project',
      description,
      dependencies,
      devDependencies,
      sources:{
        ...detected.sources,
        projectName:!name.trim()||name.trim()===detected.projectName?detected.sources.projectName:'your input',
        description:description.trim()===(detected.description||'').trim()?detected.sources.description:description.trim()?'your input':undefined,
        dependencies:dependencies.join(', ')===detected.dependencies.join(', ')?detected.sources.dependencies:dependencies.length?'your input':undefined,
        devDependencies:devDependencies.join(', ')===detected.devDependencies.join(', ')?detected.sources.devDependencies:devDependencies.length?'your input':undefined,
      },
    };
  },[sharedMeta,name,description,deps,devDeps]);
  const docs=createDocs(meta,{readme,install,gettingStarted,structure});
  const tabs=[['README', 'readme'],['Installation guide','install'],['Onboarding guide','gettingStarted'],['Project structure','structure']] as const;
  const [active,setActive]=useState<'readme'|'install'|'gettingStarted'|'structure'>('readme');
  const docsRecord={readme:docs.readme,install:docs.install,gettingStarted:docs.gettingStarted,structure:docs.structure};
  const documentNames={readme:'README.md',install:'INSTALLATION.md',gettingStarted:'GETTING_STARTED.md',structure:'PROJECT_STRUCTURE.md'};
  function handleAnalyzed(meta:ProjectMeta) {
    onAnalyzed(meta);
    setName(meta.projectName);
    setDescription(meta.description||'');
    setDeps(meta.dependencies.join(', '));
    setDevDeps(meta.devDependencies.join(', '));
    setReadme(buildPackReadme(meta));
    setSelectedReadme(meta.readmeFiles[0]?.path||'');
    setInstall(starterInstallationGuide());
    setGettingStarted(starterOnboardingGuide());
    setStructure(buildStructureSummary(meta));
    setMessage('Project metadata loaded. Missing details remain clearly labeled prompts.');
  }
  function loadReadme(path:string) {
    const found=sharedMeta?.readmeFiles.find((entry)=>entry.path===path);
    if(found) { setSelectedReadme(path);setReadme(found.content);setMessage(`Loaded existing README from ${path}.`); }
  }
  function updateActiveDocument(value:string) {
    if(active==='readme')setReadme(value);
    if(active==='install')setInstall(value);
    if(active==='gettingStarted')setGettingStarted(value);
    if(active==='structure')setStructure(value);
  }
  async function downloadPack() {
    try {
      const zip=new JSZip();
      for (const key of Object.keys(documentNames) as Array<keyof typeof documentNames>) zip.file(documentNames[key],docsRecord[key]);
      const blob=await zip.generateAsync({type:'blob'});
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='documentation-pack.zip';a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Your documentation pack is ready.');
    } catch { setMessage('Could not build the ZIP in this browser. Download the Markdown files individually.'); }
  }
  return <Layout><PageTitle kicker="DOCUMENT SET / 04" title="Documentation Pack" description="Create four editable project documents, then download them individually or together."/>
    <div style={{ display:'flex',gap:10,marginBottom:16,flexWrap:'wrap' }}><BackHome/><Link href="/project-analyzer" className="btn btn-quiet" data-testid="link-pack-analyzer"><Activity size={15}/> Analyze a ZIP</Link></div>
    <div style={{ marginBottom:16 }}><ProjectZipUpload onAnalyzed={handleAnalyzed} testIdPrefix="pack-zip" title="Upload a project ZIP" description="Reuse this session's analysis or add a ZIP here. Only supported metadata and README text are held in memory." /></div>
    <section className="panel" style={{ padding:20,marginBottom:16 }}><div style={{ display:'flex',gap:10,alignItems:'center',marginBottom:10 }}><Info size={16} color="#67d9e9"/><strong style={{ fontSize:13 }}>Project details</strong></div>
      <div className="notice" style={{ marginBottom:15 }}>{sharedMeta?.origin==='zip'?'ZIP metadata is prefilled from this session. Values you edit are user-provided; detected values retain their source labels. Existing README text stays in memory only for this session.':'No ZIP metadata in this session. Project details are optional; bracketed prompts are templates, not project facts.'}</div>
      <div className="split"><div><label className="field-label" htmlFor="pack-name">Project name <SourcePill value={fieldSource(name,sharedMeta?.projectName,sharedMeta?.sources.projectName)}/></label><input className="field" id="pack-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Optional project name" data-testid="input-pack-name"/><label className="field-label" htmlFor="pack-description" style={{ marginTop:12 }}>Description <SourcePill value={fieldSource(description,sharedMeta?.description,sharedMeta?.sources.description)}/></label><input className="field" id="pack-description" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Optional verified description" data-testid="input-pack-description"/></div><details className="optional-details"><summary>Optional package details</summary><div className="optional-details-content"><label className="field-label" htmlFor="pack-dependencies">Dependencies <SourcePill value={fieldSource(deps,sharedMeta?.dependencies.join(', '),sharedMeta?.sources.dependencies)}/></label><input className="field" id="pack-dependencies" value={deps} onChange={e=>setDeps(e.target.value)} placeholder="Manual entry, if known" data-testid="input-pack-dependencies"/><label className="field-label" htmlFor="pack-devdependencies" style={{ marginTop:12 }}>Development dependencies <SourcePill value={fieldSource(devDeps,sharedMeta?.devDependencies.join(', '),sharedMeta?.sources.devDependencies)}/></label><input className="field" id="pack-devdependencies" value={devDeps} onChange={e=>setDevDeps(e.target.value)} placeholder="Manual entry, if known" data-testid="input-pack-devdependencies"/></div></details></div>
    </section>
    <section className="panel" style={{ padding:20 }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:15 }}><div className="tab-row">{tabs.map(([label,key])=><button key={key} className="tab" aria-selected={active===key} onClick={()=>{setActive(key);setPreview(false);}} data-testid={`tab-pack-${key}`}>{label}</button>)}</div><div style={{ display:'flex',gap:8,flexWrap:'wrap' }}><button className="btn btn-quiet" onClick={()=>{setReadme(sharedMeta?.readmeFiles.find((entry)=>entry.path===selectedReadme)?.content||buildPackReadme(meta));setStructure(buildStructureSummary(meta));setMessage('README and structure drafts refreshed from current details.');}} data-testid="button-pack-refresh-drafts"><Sparkles size={15}/> Refresh drafts</button><button className="btn btn-primary" onClick={()=>void downloadPack()} data-testid="button-pack-download"><FileArchive size={15}/> Download all as ZIP</button></div></div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:10 }}>{active==='readme'&&sharedMeta?.readmeFiles.length ? <label className="readme-picker-label" htmlFor="pack-readme-source">Use detected README
          <select id="pack-readme-source" className="field" value={selectedReadme} onChange={(event)=>loadReadme(event.target.value)} data-testid="select-pack-readme-source">{sharedMeta.readmeFiles.map((item)=><option key={item.path} value={item.path}>{item.path}</option>)}</select>
        </label> : <label className="field-label" style={{ margin:0 }}>{active==='gettingStarted'?'Onboarding guide · GETTING_STARTED.md':documentNames[active]} {active==='install'?'— add verified steps':active==='gettingStarted'?'— add the real project workflow':active==='structure'?'— review detected structure':''}</label>}<div className="tab-row"><button className="tab" aria-selected={!preview} onClick={()=>setPreview(false)} data-testid="button-pack-edit">Edit</button><button className="tab" aria-selected={preview} onClick={()=>setPreview(true)} data-testid="button-pack-preview">Preview</button></div></div>
      {preview ? <div className="prose-preview panel" style={{ minHeight:360,padding:20 }} dangerouslySetInnerHTML={{__html:markdownToSafeHtml(docsRecord[active])}} data-testid={`preview-pack-${active}`}/> : active==='readme' ? <textarea className="field code" rows={18} id="pack-readme" aria-label="Edit README Markdown" value={readme} onChange={e=>setReadme(e.target.value)} data-testid="textarea-pack-readme"/> : active==='install' ? <div><textarea className="field code" rows={15} id="pack-install" aria-label="Edit installation guide" value={install} onChange={e=>setInstall(e.target.value)} placeholder="## Prerequisites&#10;&#10;List verified prerequisites.&#10;&#10;## Install&#10;&#10;Add actual installation steps." data-testid="textarea-pack-install"/><div className="notice" style={{ marginTop:10 }}>Detected scripts and dependencies are metadata, not install instructions.</div></div> : active==='gettingStarted' ? <div><textarea className="field code" rows={15} id="pack-getting-started" aria-label="Edit onboarding guide" value={gettingStarted} onChange={e=>setGettingStarted(e.target.value)} placeholder="## Before you begin&#10;&#10;Add verified prerequisites and first steps." data-testid="textarea-pack-getting-started"/><div className="notice" style={{ marginTop:10 }}>No workflow commands or project architecture are inferred.</div></div> : <div><textarea className="field code" rows={15} id="pack-structure" aria-label="Edit project structure summary" value={structure} onChange={e=>setStructure(e.target.value)} placeholder="Add verified project folders and files." data-testid="textarea-pack-structure"/><div className="notice" style={{ marginTop:10 }}>When no ZIP is supplied, the structure is labeled as a template until you add verified details.</div></div>}
      <div style={{ display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap',marginTop:15 }}><button className="btn btn-quiet" onClick={()=>downloadText(documentNames[active],docsRecord[active])} data-testid="button-pack-download-individual"><ArrowDownToLine size={15}/> Download this Markdown file</button><ToastLine message={message}/></div>
    </section>
    <section className="panel" style={{ padding:20,marginTop:16,marginBottom:30 }}><div className="eyebrow">STRUCTURE SUMMARY</div><div style={{ display:'flex',gap:14,flexWrap:'wrap',marginTop:13 }}><div className="stat-box"><strong>{meta.fileCount}</strong><span>supported files</span></div><div className="stat-box"><strong>{meta.lineEstimate}</strong><span>estimated lines</span></div><div className="stat-box"><strong>{meta.technologies.length?meta.technologies.join(', '):'Not provided'}</strong><span>technology hints</span></div></div><p style={{ color:'#91a2b3',fontSize:11 }}>Origin: {meta.origin==='zip'?'analyzer metadata shared in memory':'manual/template entry'}. No commands, architecture, tests, or security status are inferred.</p></section>
  </Layout>;
}

function Privacy() {
  return <Layout><PageTitle kicker="PLAIN-LANGUAGE PROMISE" title="Privacy, by default." description="Docu-Flow is a static, client-only set of tools. It has no accounts, upload service, or server-side processing."/><div className="panel" style={{ padding:24,marginBottom:26 }}>
    <div style={{ display:'grid',gap:22 }}>
      <div><h2 style={{ fontSize:16 }}>Your files stay in the browser</h2><p style={{ color:'#a4b3c1',fontSize:13,lineHeight:1.8 }}>ZIP inspection, document generation, and utility processing happen locally in your browser. This app does not intentionally send your files or text anywhere, does not save project source in local storage, and does not run uploaded source code.</p></div>
      <div><h2 style={{ fontSize:16 }}>No accounts or analytics</h2><p style={{ color:'#a4b3c1',fontSize:13,lineHeight:1.8 }}>There are no accounts, database, analytics, or AI/API calls in this app. The “AI” in the product name does not mean an AI model is contacted; generation is template-based.</p></div>
       <div><h2 style={{ fontSize:16 }}>Local limits</h2><p style={{ color:'#a4b3c1',fontSize:13,lineHeight:1.8 }}>Project Analyzer accepts ZIP files up to 5 MB and 100 supported files to inspect, skips selected bulky folders and unsupported or oversized text. Results are a simplified inventory—not a security scan or complete code review. Documentation tools keep detected metadata and supported README text only in browser memory for the current app session; they are not saved to local storage or a server.</p></div>
      <div><h2 style={{ fontSize:16 }}>Use care with sensitive content</h2><p style={{ color:'#a4b3c1',fontSize:13,lineHeight:1.8 }}>Do not paste private keys, passwords, tokens, confidential code, or other secrets into these tools. Feedback opens a draft in your email application; sending it is outside Docu-Flow.</p></div>
    </div>
    <div style={{ marginTop:24 }}><BackHome/></div>
  </div></Layout>;
}
function About() {
  return <Layout><PageTitle kicker="ABOUT DOCU-FLOW" title="Less setup. More useful docs." description="Docu-Flow is a small, local-first workbench for the practical documentation and utility tasks around a software project."/><section className="panel" style={{ padding:24,marginBottom:28 }}><p style={{ color:'#a4b3c1',lineHeight:1.8,fontSize:14 }}>Pick a focused tool, do the work in your browser, and take the result with you. README and documentation drafts are deliberately template-based: you stay in control of the facts, commands, and claims that describe your project.</p><div style={{ display:'flex',gap:10,flexWrap:'wrap',marginTop:20 }}><BackHome/><Link className="btn btn-quiet" href="/privacy" data-testid="link-about-privacy"><ShieldCheck size={15}/> Privacy details</Link></div></section></Layout>;
}
function Router() {
  const [location] = useLocation();
  const [sharedMeta,setSharedMeta]=useState<ProjectMeta|null>(null);
  return <ErrorBoundary resetKey={location}><Switch>
    <Route path="/" component={Home}/>
     <Route path="/readme-studio"><ReadmeStudio sharedMeta={sharedMeta} onAnalyzed={setSharedMeta}/></Route>
     <Route path="/project-analyzer"><ProjectAnalyzer sharedMeta={sharedMeta} onAnalyzed={setSharedMeta}/></Route>
    <Route path="/developer-utilities" component={Utilities}/>
     <Route path="/documentation-pack"><DocumentationPack sharedMeta={sharedMeta} onAnalyzed={setSharedMeta}/></Route>
    <Route path="/privacy" component={Privacy}/>
    <Route path="/about" component={About}/>
    <Route component={NotFound}/>
  </Switch></ErrorBoundary>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router/></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>;
}
export default App;
