import React, { useState, useEffect, useMemo } from 'react';
import type { AppManifest } from '../../types';
import { useShell } from '../../shell/store';

export const manifest: AppManifest = {
  id: 'onthology',
  name: 'Onthology (Palantir)',
  kind: 'singleton',
  description: 'Plateforme Ontologique Palantir Foundry · Monocle Lineage, 5-Layer Framework, Process Mining, Contour, Vertex AIP, Workshop & Quiver',
  icon: '🌐',
  domaine: 'l0-tech',
};

type ViewMode = 'lineage' | 'framework' | 'mining' | 'explorer' | 'contour' | 'vertex' | 'workshop' | 'quiver';

interface GraphNode {
  id: string;
  type: string;
  degre: number;
}

interface GraphEdge {
  source: string;
  predicate: string;
  target: string;
  provenance: string;
  confidence: string;
}

interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata?: {
    total_nodes: number;
    total_edges: number;
  };
}

// Couleurs Foundry exactes inspirées de Palantir Monocle
const PALANTIR_COLORS = {
  raw: { bg: 'bg-[#b45309]/20', border: 'border-[#f59e0b]', text: 'text-[#fbbf24]', hex: '#f59e0b', tag: 'Raw' },
  clean: { bg: 'bg-[#047857]/20', border: 'border-[#10b981]', text: 'text-[#34d399]', hex: '#10b981', tag: 'Clean' },
  nlp: { bg: 'bg-[#a21caf]/20', border: 'border-[#d946ef]', text: 'text-[#f0abfc]', hex: '#d946ef', tag: 'Parsing/NLP/ML' },
  ontology: { bg: 'bg-[#1e1b4b]/80', border: 'border-[#818cf8]', text: 'text-[#c7d2fe]', hex: '#6366f1', tag: 'Ontology' },
  alerting: { bg: 'bg-[#1e3a8a]/40', border: 'border-[#3b82f6]', text: 'text-[#93c5fd]', hex: '#3b82f6', tag: 'Alerting' },
  transform: { bg: 'bg-[#c2410c]/20', border: 'border-[#f97316]', text: 'text-[#fdba74]', hex: '#f97316', tag: 'Transform' },
  app: { bg: 'bg-[#0e7490]/20', border: 'border-[#06b6d4]', text: 'text-[#67e8f9]', hex: '#06b6d4', tag: 'Application' },
};

interface MonocleNode {
  id: string;
  label: string;
  stage: 'raw' | 'clean' | 'nlp' | 'transform' | 'alerting' | 'ontology';
  x: number;
  y: number;
  targets: string[];
  count?: string;
  isBox?: boolean;
  rid?: string;
  schema?: Array<{ name: string; type: string }>;
}

const MONOCLE_DAG_NODES: MonocleNode[] = [
  // STAGE 1: RAW
  { id: 'raw_white', label: 'White Listed Companies', stage: 'raw', x: 40, y: 30, targets: ['clean_white'], count: '14 items', rid: 'ri.foundry.main.dataset.raw-white-listed', schema: [{ name: 'company_id', type: 'string' }, { name: 'domain', type: 'string' }, { name: 'verified_at', type: 'timestamp' }] },
  { id: 'raw_chinese', label: 'Raw/Chinese Corporate Registry Data', stage: 'raw', x: 40, y: 90, targets: ['clean_chinese'], count: '482 Ko', rid: 'ri.foundry.main.dataset.raw-chinese-registry', schema: [{ name: 'reg_num', type: 'string' }, { name: 'corp_name', type: 'string' }, { name: 'capital', type: 'decimal' }] },
  { id: 'raw_corp', label: 'Raw/Worldwide Corporations', stage: 'raw', x: 40, y: 150, targets: ['clean_corp'], count: '1.2 Mo', rid: 'ri.foundry.main.dataset.raw-worldwide-corps', schema: [{ name: 'lei_code', type: 'string' }, { name: 'legal_name', type: 'string' }, { name: 'country', type: 'string' }] },
  { id: 'raw_vendors', label: 'Raw/Company Vendors', stage: 'raw', x: 40, y: 210, targets: ['clean_vendors'], count: '312 items', rid: 'ri.foundry.main.dataset.raw-company-vendors', schema: [{ name: 'vendor_id', type: 'string' }, { name: 'tier', type: 'integer' }, { name: 'spend_usd', type: 'decimal' }] },
  { id: 'raw_holding', label: 'Raw/Holding Companies', stage: 'raw', x: 40, y: 270, targets: ['clean_holding'], count: '89 items', rid: 'ri.foundry.main.dataset.raw-holding-corps', schema: [{ name: 'holding_id', type: 'string' }, { name: 'shares_pct', type: 'float' }] },
  { id: 'raw_subsidiaries', label: 'Raw/Company Subsidiaries', stage: 'raw', x: 40, y: 330, targets: ['clean_subsidiaries'], count: '144 items', rid: 'ri.foundry.main.dataset.raw-subsidiaries', schema: [{ name: 'parent_id', type: 'string' }, { name: 'subsidiary_id', type: 'string' }] },
  { id: 'raw_customers', label: 'Raw/Company Customers', stage: 'raw', x: 40, y: 390, targets: ['clean_customers'], count: '920 items', rid: 'ri.foundry.main.dataset.raw-customers', schema: [{ name: 'cust_id', type: 'string' }, { name: 'arr_eur', type: 'decimal' }] },
  { id: 'raw_google_pr', label: 'Google Press Releases', stage: 'raw', x: 40, y: 450, targets: ['clean_google_pr'], count: '4.8 Mo', rid: 'ri.foundry.main.dataset.raw-google-pr', schema: [{ name: 'article_id', type: 'string' }, { name: 'text', type: 'string' }] },
  { id: 'raw_bloomberg', label: 'Bloomberg Press Releases', stage: 'raw', x: 40, y: 510, targets: ['clean_bloomberg'], count: '3.1 Mo', rid: 'ri.foundry.main.dataset.raw-bloomberg-pr', schema: [{ name: 'ticker', type: 'string' }, { name: 'headline', type: 'string' }] },
  { id: 'raw_executives', label: 'Business Executives', stage: 'raw', x: 40, y: 570, targets: ['clean_executives'], count: '840 items', rid: 'ri.foundry.main.dataset.raw-executives', schema: [{ name: 'person_id', type: 'string' }, { name: 'role', type: 'string' }] },
  { id: 'raw_intel', label: 'Intelligence Database', stage: 'raw', x: 40, y: 630, targets: ['clean_intel'], count: 'uc.db WAL', rid: 'ri.foundry.main.dataset.raw-intel-db', schema: [{ name: 'entry_id', type: 'string' }, { name: 'classification', type: 'string' }] },
  { id: 'raw_products', label: 'Raw/Company Products', stage: 'raw', x: 40, y: 700, targets: ['clean_products'], count: '210 items', rid: 'ri.foundry.main.dataset.raw-products', schema: [{ name: 'sku', type: 'string' }, { name: 'category', type: 'string' }] },
  { id: 'raw_vuln', label: 'Raw/Software Vulnerabilities', stage: 'raw', x: 40, y: 770, targets: ['clean_vuln'], count: '18 CVEs', rid: 'ri.foundry.main.dataset.raw-vulnerabilities', schema: [{ name: 'cve_id', type: 'string' }, { name: 'cvss_score', type: 'float' }] },
  { id: 'raw_sbom', label: 'Raw/Company Software - SBOM', stage: 'raw', x: 40, y: 830, targets: ['clean_sbom'], count: '64 pkgs', rid: 'ri.foundry.main.dataset.raw-software-sbom', schema: [{ name: 'pkg_name', type: 'string' }, { name: 'version', type: 'string' }] },

  // STAGE 2: CLEAN
  { id: 'clean_white', label: 'White Listed Companies', stage: 'clean', x: 300, y: 30, targets: ['onto_corp'], count: 'Sanitized', rid: 'ri.foundry.main.dataset.clean-white-listed' },
  { id: 'clean_chinese', label: 'Clean/Chinese Corporate Registry Data', stage: 'clean', x: 300, y: 90, targets: ['trans_chinese_trans', 'trans_unified'], count: 'Verified', rid: 'ri.foundry.main.dataset.clean-chinese-reg' },
  { id: 'clean_corp', label: '< Clean/Worldwide Corporations >', stage: 'clean', x: 300, y: 150, targets: ['trans_unified', 'trans_prefixes'], count: 'Deduped', rid: 'ri.foundry.main.dataset.clean-worldwide-corps' },
  { id: 'clean_vendors', label: 'Clean/Company Vendors', stage: 'clean', x: 300, y: 210, targets: ['trans_unified', 'trans_network'], count: 'OK', rid: 'ri.foundry.main.dataset.clean-company-vendors' },
  { id: 'clean_holding', label: 'Clean/Holding Companies', stage: 'clean', x: 300, y: 270, targets: ['trans_unified'], count: 'OK', rid: 'ri.foundry.main.dataset.clean-holding-corps' },
  { id: 'clean_subsidiaries', label: 'Clean/Company Subsidiaries', stage: 'clean', x: 300, y: 330, targets: ['trans_unified'], count: 'OK', rid: 'ri.foundry.main.dataset.clean-subsidiaries' },
  { id: 'clean_customers', label: 'Clean/Company Customers', stage: 'clean', x: 300, y: 390, targets: ['trans_network'], count: 'OK', rid: 'ri.foundry.main.dataset.clean-customers' },
  { id: 'clean_google_pr', label: 'Google Press Releases Clean', stage: 'clean', x: 300, y: 450, targets: ['trans_pr_releases'], count: 'Parsed', rid: 'ri.foundry.main.dataset.clean-google-pr' },
  { id: 'clean_bloomberg', label: 'Bloomberg Press Releases Clean', stage: 'clean', x: 300, y: 510, targets: ['trans_pr_releases'], count: 'Parsed', rid: 'ri.foundry.main.dataset.clean-bloomberg-pr' },
  { id: 'clean_executives', label: 'Business Executives Clean', stage: 'clean', x: 300, y: 570, targets: ['trans_personnel'], count: 'OK', rid: 'ri.foundry.main.dataset.clean-executives' },
  { id: 'clean_intel', label: 'Intelligence Database Clean', stage: 'clean', x: 300, y: 630, targets: ['trans_call_records'], count: 'OK', rid: 'ri.foundry.main.dataset.clean-intel-db' },
  { id: 'clean_products', label: 'Clean/Company Products >', stage: 'clean', x: 300, y: 700, targets: ['onto_product'], count: 'OK', rid: 'ri.foundry.main.dataset.clean-products' },
  { id: 'clean_vuln', label: 'Clean/Software Vulnerabilities', stage: 'clean', x: 300, y: 770, targets: ['onto_vuln'], count: 'OK', rid: 'ri.foundry.main.dataset.clean-vulnerabilities' },
  { id: 'clean_sbom', label: 'Clean/Company Software - SBOM', stage: 'clean', x: 300, y: 830, targets: ['onto_software'], count: 'OK', rid: 'ri.foundry.main.dataset.clean-software-sbom' },

  // STAGE 3: TRANSFORMS
  { id: 'trans_chinese_trans', label: 'Chinese Entities Translated', stage: 'clean', x: 540, y: 90, targets: ['trans_unified'], count: 'NLP', rid: 'ri.foundry.main.dataset.transform-chinese-trans' },
  { id: 'trans_prefixes', label: 'Entity Prefixes and Suffixes', stage: 'clean', x: 540, y: 160, targets: ['trans_unified'], count: 'Cleaned', rid: 'ri.foundry.main.dataset.transform-prefixes' },
  { id: 'trans_unified', label: '< Unified Entities >', stage: 'transform', x: 740, y: 220, targets: ['nlp_resolved', 'trans_network'], count: '1 681 nds', rid: 'ri.foundry.main.dataset.transform-unified-entities' },
  { id: 'trans_network', label: 'Entity Network >', stage: 'transform', x: 740, y: 300, targets: ['nlp_impact', 'onto_corp'], count: 'Graph', rid: 'ri.foundry.main.dataset.transform-entity-network' },
  { id: 'trans_pr_releases', label: 'united_press_releases', stage: 'transform', x: 740, y: 480, targets: ['nlp_training', 'nlp_parsed_pr'], count: 'Unified', rid: 'ri.foundry.main.dataset.transform-united-pr' },
  { id: 'trans_personnel', label: 'union_personnel >', stage: 'transform', x: 740, y: 560, targets: ['onto_personnel', 'onto_contract'], count: 'Unified', rid: 'ri.foundry.main.dataset.transform-union-personnel' },
  { id: 'trans_call_records', label: 'Call Records Enriched', stage: 'transform', x: 740, y: 640, targets: ['onto_call_record'], count: 'Enriched', rid: 'ri.foundry.main.dataset.transform-call-records' },

  // STAGE 4: NLP
  { id: 'nlp_resolved', label: 'Resolved Entities >', stage: 'nlp', x: 960, y: 220, targets: ['onto_corp', 'onto_rule'], count: 'Entity Co-ref', rid: 'ri.foundry.main.dataset.nlp-resolved-entities' },
  { id: 'nlp_impact', label: 'Supply Chain Impact Algorithm', stage: 'nlp', x: 960, y: 300, targets: ['onto_corp', 'alert_rule_obj'], count: 'ML Model', rid: 'ri.foundry.main.dataset.nlp-impact-algo' },
  { id: 'nlp_training', label: 'NLP Training Data', stage: 'nlp', x: 960, y: 480, targets: ['nlp_parsed_pr'], count: 'Embeddings', rid: 'ri.foundry.main.dataset.nlp-training-data' },
  { id: 'nlp_parsed_pr', label: 'NLP Parsed Press Releases', stage: 'nlp', x: 1040, y: 430, targets: ['onto_press_release', 'alert_alerts'], count: 'Extracted', rid: 'ri.foundry.main.dataset.nlp-parsed-pr' },

  // STAGE 5: ALERTING & RULES
  { id: 'alert_alerts', label: '< Alerts >', stage: 'alerting', x: 1140, y: 460, targets: ['onto_alert'], count: '3 Active', rid: 'ri.foundry.main.dataset.alert-alerts' },
  { id: 'alert_rule_obj', label: 'Rule Object >', stage: 'alerting', x: 1140, y: 520, targets: ['onto_rule'], count: 'Config', rid: 'ri.foundry.main.dataset.alert-rule-object' },

  // STAGE 6: ONTOLOGY OBJECTS
  { id: 'onto_rule', label: '< [SCRM] Rule >', stage: 'ontology', x: 1300, y: 160, targets: ['onto_corp'], isBox: true, count: 'Entity', rid: 'ri.foundry.main.dataset.onto-rule' },
  { id: 'onto_alert', label: '< [SCRM] Alert >', stage: 'ontology', x: 1380, y: 180, targets: ['onto_corp'], isBox: true, count: 'Entity', rid: 'ri.foundry.main.dataset.onto-alert' },
  { id: 'onto_corp', label: '< [SCRM] Corporation >', stage: 'ontology', x: 1480, y: 200, targets: ['onto_personnel', 'onto_contract'], isBox: true, count: 'Entity', rid: 'ri.foundry.main.dataset.onto-corporation' },
  { id: 'onto_press_release', label: '[SCRM] Press Release', stage: 'ontology', x: 1380, y: 380, targets: ['onto_corp'], isBox: true, count: 'Entity', rid: 'ri.foundry.main.dataset.onto-press-release' },
  { id: 'onto_product', label: '[SCRM] Product', stage: 'ontology', x: 1380, y: 480, targets: ['onto_corp'], isBox: true, count: 'Entity', rid: 'ri.foundry.main.dataset.onto-product' },
  { id: 'onto_personnel', label: '[SCRM] Personnel', stage: 'ontology', x: 1620, y: 350, targets: ['onto_contract'], isBox: true, count: 'Entity', rid: 'ri.foundry.main.dataset.onto-personnel' },
  { id: 'onto_software', label: '[SCRM] Software', stage: 'ontology', x: 1380, y: 570, targets: ['onto_vuln'], isBox: true, count: 'Entity', rid: 'ri.foundry.main.dataset.onto-software' },
  { id: 'onto_call_record', label: '[SCRM] Call Record', stage: 'ontology', x: 1520, y: 570, targets: ['onto_corp'], isBox: true, count: 'Entity', rid: 'ri.foundry.main.dataset.onto-call-record' },
  { id: 'onto_contract', label: '< [SCRM] Contract >', stage: 'ontology', x: 1620, y: 480, targets: [], isBox: true, count: 'Entity', rid: 'ri.foundry.main.dataset.onto-contract' },
  { id: 'onto_vuln', label: '[SCRM] Vulnerabilities', stage: 'ontology', x: 1500, y: 680, targets: [], isBox: true, count: 'Entity', rid: 'ri.foundry.main.dataset.onto-vulnerabilities' },
];

export function OnthologyApp({ payload }: { payload?: Record<string, unknown> } = {}) {
  const initialView = (payload?.targetTab as ViewMode) || 'lineage';
  const [activeView, setActiveView] = useState<ViewMode>(initialView);

  useEffect(() => {
    if (payload?.targetTab && ['lineage', 'framework', 'mining', 'explorer', 'contour', 'vertex', 'workshop', 'quiver'].includes(payload.targetTab as string)) {
      setActiveView(payload.targetTab as ViewMode);
    }
  }, [payload?.targetTab]);

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [graphData, setGraphData] = useState<KnowledgeGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ id: string; type: string; degre: number; stage?: string; rid?: string; schema?: any[] } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [flowAnimation, setFlowAnimation] = useState(true);

  // Zoom / Pan pour le canvas
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 40, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Modals & Header Tools State
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('master');
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'dag' | 'orthogonal' | 'compact'>('dag');
  const [canvasSearch, setCanvasSearch] = useState('');
  const [activeInspectorTab, setActiveInspectorTab] = useState<'overview' | 'schema' | 'preview'>('overview');

  // Process Mining State
  const [transitionThreshold, setTransitionThreshold] = useState(17);
  const [selectedMiningTab, setSelectedMiningTab] = useState<'overview' | 'single'>('overview');
  const [miningTypeFilter, setMiningTypeFilter] = useState<{ [key: string]: boolean }>({
    'Missing Bonding...': true,
    'Misaligned Rh doo...': false,
    'No value': false,
  });

  // Contour State
  const [selectedContourClass, setSelectedContourClass] = useState<string>('all');

  // Vertex / AIP State
  const [aipPrompt, setAipPrompt] = useState('Analyse les hubs critiques de Tech OS et propose une action de remédiation');
  const [aipResponse, setAipResponse] = useState<any>(null);
  const [aipLoading, setAipLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [aipViewTab, setAipViewTab] = useState<'chat' | 'code'>('chat');

  // Quiver Pathfinding State
  const [quiverSource, setQuiverSource] = useState('tech-os');
  const [quiverTarget, setQuiverTarget] = useState('business-os');

  // Create Object Modal State
  const [newObjId, setNewObjId] = useState('');
  const [newObjType, setNewObjType] = useState('concept');
  const [newObjTarget, setNewObjTarget] = useState('aspace:L0_Tech_OS_Kernel');

  useEffect(() => {
    fetch('/api/tech-os/graham-graph')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.graph) {
          setGraphData(data.graph);
          if (data.graph.nodes && data.graph.nodes.length > 0) {
            setSelectedNode(data.graph.nodes[0]);
          }
        }
      })
      .catch((err) => console.error('Erreur chargement ontologie:', err));
  }, []);

  const handleRunAip = async (promptToRun?: string) => {
    const p = promptToRun || aipPrompt;
    setAipLoading(true);
    setActionSuccessMsg(null);
    try {
      const res = await fetch('/api/tech-os/osdk/aip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p }),
      });
      const data = await res.json();
      if (data.ok) {
        setAipResponse(data);
      }
    } catch (err) {
      console.error('Erreur AIP:', err);
    } finally {
      setAipLoading(false);
    }
  };

  const handleApplyAction = async (actionName: string, payload: any) => {
    try {
      const res = await fetch('/api/tech-os/osdk/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionName, payload }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionSuccessMsg(data.result || 'Action exécutée avec succès.');
        setActiveModal(null);
        fetch('/api/tech-os/graham-graph')
          .then((r) => r.json())
          .then((d) => d.ok && setGraphData(d.graph));
      } else {
        alert(`Erreur: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Erreur réseau: ${err.message}`);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  const nodeRelations = useMemo(() => {
    if (!selectedNode || !graphData?.edges) return { incoming: [], outgoing: [] };
    const nid = selectedNode.id.toLowerCase();
    const incoming = graphData.edges.filter((e) => e.target.toLowerCase() === nid);
    const outgoing = graphData.edges.filter((e) => e.source.toLowerCase() === nid);
    return { incoming, outgoing };
  }, [selectedNode, graphData]);

  const filteredMonocleNodes = useMemo(() => {
    if (!canvasSearch) return MONOCLE_DAG_NODES;
    return MONOCLE_DAG_NODES.filter(
      (n) => n.label.toLowerCase().includes(canvasSearch.toLowerCase()) || n.id.toLowerCase().includes(canvasSearch.toLowerCase())
    );
  }, [canvasSearch]);

  return (
    <div className="flex h-full bg-[#0d1017] text-slate-200 select-none overflow-hidden font-sans text-xs">
      {/* 1. PALANTIR FOUNDRY LEFT NAVIGATION RAIL (EXPANDABLE) */}
      <aside
        className={`bg-[#090b10] border-r border-[#1a2130] flex flex-col justify-between py-2 shrink-0 z-30 transition-all duration-200 ${
          sidebarExpanded ? 'w-64 shadow-2xl' : 'w-14'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Top Header with Prominent Toggle */}
          <div className="px-2.5 flex items-center justify-between">
            <div
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="flex items-center gap-2.5 cursor-pointer group"
              title={sidebarExpanded ? 'Replier le Sidebar' : 'Déplier le Sidebar (Foundry Rail)'}
            >
              <div className="w-8 h-8 rounded-lg bg-[#1e293b] border border-[#334155] flex items-center justify-center text-blue-400 font-bold text-sm shadow-md group-hover:border-blue-400 group-hover:bg-blue-950/40">
                ◎
              </div>
              {sidebarExpanded && (
                <div className="leading-tight">
                  <div className="font-bold text-white tracking-wide text-xs">PALANTIR FOUNDRY</div>
                  <div className="text-[9px] text-slate-500 font-mono">A&apos;Space OS V3 Core</div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors"
              title={sidebarExpanded ? 'Replier' : 'Déplier'}
            >
              {sidebarExpanded ? '◀' : '▶'}
            </button>
          </div>

          <div className="w-full h-[1px] bg-slate-800 my-2" />

          {/* Quick Actions */}
          <div className="flex flex-col gap-1 px-2">
            <button
              onClick={() => setActiveModal('search')}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Recherche Globale (⌘K)"
            >
              <span className="w-6 text-center text-sm">🔍</span>
              {sidebarExpanded && <span className="font-medium">Recherche (⌘K)</span>}
            </button>
          </div>

          <div className="w-full h-[1px] bg-slate-800 my-2" />

          {/* APPS DIRECTORY */}
          <div className="px-3 mb-1 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
            {sidebarExpanded ? 'Foundry Suite & OSDK' : 'Apps'}
          </div>

          <div className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto">
            {/* 1. Lineage */}
            <button
              onClick={() => setActiveView('lineage')}
              className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                activeView === 'lineage'
                  ? 'bg-blue-600/25 text-blue-400 border border-blue-500/50 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Data Lineage (Monocle)"
            >
              <span className="w-6 text-center text-base">🕸️</span>
              {sidebarExpanded && (
                <div className="text-left leading-tight truncate">
                  <div>Data Lineage</div>
                  <div className="text-[10px] text-slate-500 font-normal">Monocle Pipeline DAG</div>
                </div>
              )}
            </button>

            {/* 2. Object Explorer */}
            <button
              onClick={() => setActiveView('explorer')}
              className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                activeView === 'explorer'
                  ? 'bg-blue-600/25 text-blue-400 border border-blue-500/50 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Object Explorer"
            >
              <span className="w-6 text-center text-base">📦</span>
              {sidebarExpanded && (
                <div className="text-left leading-tight truncate">
                  <div>Object Explorer</div>
                  <div className="text-[10px] text-slate-500 font-normal">1 681 Entités Semantica</div>
                </div>
              )}
            </button>

            {/* 3. 5-Layer Framework */}
            <button
              onClick={() => setActiveView('framework')}
              className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                activeView === 'framework'
                  ? 'bg-blue-600/25 text-blue-400 border border-blue-500/50 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Palantir 5-Layer Framework"
            >
              <span className="w-6 text-center text-base">🏛️</span>
              {sidebarExpanded && (
                <div className="text-left leading-tight truncate">
                  <div>5-Layer Framework</div>
                  <div className="text-[10px] text-slate-500 font-normal">Substrat Souverain</div>
                </div>
              )}
            </button>

            {/* 4. Process Mining */}
            <button
              onClick={() => setActiveView('mining')}
              className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                activeView === 'mining'
                  ? 'bg-blue-600/25 text-blue-400 border border-blue-500/50 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Process Mining"
            >
              <span className="w-6 text-center text-base">📊</span>
              {sidebarExpanded && (
                <div className="text-left leading-tight truncate">
                  <div>Process Mining</div>
                  <div className="text-[10px] text-slate-500 font-normal">Non-Conformités &amp; SLA</div>
                </div>
              )}
            </button>

            {/* 5. Contour */}
            <button
              onClick={() => setActiveView('contour')}
              className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                activeView === 'contour'
                  ? 'bg-blue-600/25 text-blue-400 border border-blue-500/50 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Contour Analytical Paths"
            >
              <span className="w-6 text-center text-base">📈</span>
              {sidebarExpanded && (
                <div className="text-left leading-tight truncate">
                  <div>Contour</div>
                  <div className="text-[10px] text-slate-500 font-normal">Chemins &amp; Cohortes</div>
                </div>
              )}
            </button>

            {/* 6. Vertex AIP */}
            <button
              onClick={() => setActiveView('vertex')}
              className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                activeView === 'vertex'
                  ? 'bg-blue-600/25 text-blue-400 border border-blue-500/50 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Vertex AIP Engine"
            >
              <span className="w-6 text-center text-base">⚡</span>
              {sidebarExpanded && (
                <div className="text-left leading-tight truncate">
                  <div>Vertex (AIP)</div>
                  <div className="text-[10px] text-slate-500 font-normal">Ontology-Grounded AI</div>
                </div>
              )}
            </button>

            {/* 7. Workshop (Cockpit Opérationnel) */}
            <button
              onClick={() => setActiveView('workshop')}
              className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                activeView === 'workshop'
                  ? 'bg-blue-600/25 text-blue-400 border border-blue-500/50 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Workshop (Cockpit Opérationnel)"
            >
              <span className="w-6 text-center text-base">🛠️</span>
              {sidebarExpanded && (
                <div className="text-left leading-tight truncate">
                  <div>Workshop</div>
                  <div className="text-[10px] text-slate-500 font-normal">Cockpit &amp; Baux uc.db</div>
                </div>
              )}
            </button>

            {/* 8. Quiver (Analyse de Graphe) */}
            <button
              onClick={() => setActiveView('quiver')}
              className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                activeView === 'quiver'
                  ? 'bg-blue-600/25 text-blue-400 border border-blue-500/50 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Quiver (Graphe & Centralité)"
            >
              <span className="w-6 text-center text-base">🔮</span>
              {sidebarExpanded && (
                <div className="text-left leading-tight truncate">
                  <div>Quiver</div>
                  <div className="text-[10px] text-slate-500 font-normal">Pathfinding &amp; Centralité</div>
                </div>
              )}
            </button>
          </div>

          {/* Bottom Harness & Operator Bar */}
          <div className="p-2.5 border-t border-slate-800 bg-[#07090e]">
            {sidebarExpanded ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <span>●</span>
                    <span>HoH Meta-Harness</span>
                  </span>
                  <span className="bg-blue-950 px-1.5 py-0.2 rounded border border-blue-800 text-blue-300 font-mono text-[9px]">
                    OSDK 2.4
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Co-Évolution Modèle-Harnais
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" title="HoH Active" />
                <span className="text-[8px] font-mono text-slate-500">HoH</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* TOP BREADCRUMB BAR */}
        <header className="h-10 px-4 bg-[#111622] border-b border-[#1f2738] flex items-center justify-between gap-3 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">A&apos;Space OS V3</span>
              <span className="text-slate-600">&gt;</span>
              <span className="text-white font-bold tracking-wide flex items-center gap-1.5">
                <span>Onthology Monocle View V2</span>
                <span className="text-amber-400 text-xs">★</span>
              </span>
            </div>

            <div className="h-4 w-[1px] bg-slate-700 mx-2" />

            {/* Branch Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                className="flex items-center gap-1.5 bg-[#1a2130] hover:bg-[#222c40] px-2.5 py-1 rounded border border-[#2b374e] text-[11px] font-mono text-slate-200 transition-colors"
              >
                <span className="text-emerald-400">🌱</span>
                <span>{selectedBranch}</span>
                <span className="text-slate-500">▾</span>
              </button>

              {showBranchDropdown && (
                <div className="absolute top-8 left-0 w-44 bg-[#141a26] border border-[#232c40] rounded-lg shadow-2xl py-1 z-50 text-xs">
                  {['master', 'staging-v3', 'experiment-osdk'].map((b) => (
                    <div
                      key={b}
                      onClick={() => { setSelectedBranch(b); setShowBranchDropdown(false); }}
                      className="px-3 py-1.5 hover:bg-blue-600 hover:text-white cursor-pointer font-mono flex items-center justify-between"
                    >
                      <span>{b}</span>
                      {selectedBranch === b && <span className="text-emerald-400">✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PALANTIR LEGEND & ACTION BUTTONS */}
          <div className="flex items-center gap-4">
            <div className="hidden 2xl:flex items-center gap-2.5 text-[10px] font-mono bg-[#161c28] px-3 py-1 rounded-md border border-[#222c40]">
              <span className="text-slate-400 font-semibold mr-1">Node color options:</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b] inline-block" /> Raw (14)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#10b981] inline-block" /> Clean (17)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#d946ef] inline-block" /> Parsing/NLP/ML (4)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#1e1b4b] border border-[#818cf8] inline-block" /> Ontology (10)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6] inline-block" /> Alerting (3)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#f97316] inline-block" /> Transform (5)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFlowAnimation(!flowAnimation)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors flex items-center gap-1 ${
                  flowAnimation ? 'bg-blue-950 text-blue-300 border-blue-700' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <span>{flowAnimation ? '● Flow Active' : '○ Flow Paused'}</span>
              </button>

              {/* Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 flex items-center gap-1"
                >
                  <span>Actions</span>
                  <span>▾</span>
                </button>

                {showActionsDropdown && (
                  <div className="absolute right-0 top-8 w-60 bg-[#141a26] border border-[#232c40] rounded-lg shadow-2xl py-1 z-50 text-xs">
                    <div
                      onClick={() => { setActiveModal('create_object'); setShowActionsDropdown(false); }}
                      className="px-3 py-2 hover:bg-blue-600 hover:text-white cursor-pointer flex items-center gap-2"
                    >
                      <span>➕</span>
                      <span>Créer un Objet Ontologique</span>
                    </div>
                    <div
                      onClick={() => {
                        handleApplyAction('triggerWorkflowPipeline', { pipelineId: 'semantica_distill', dryRun: true });
                        setShowActionsDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-blue-600 hover:text-white cursor-pointer flex items-center gap-2"
                    >
                      <span>⚡</span>
                      <span>Déclencher Pipeline (Dry-Run)</span>
                    </div>
                    <div
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(MONOCLE_DAG_NODES, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'palantir_monocle_dag.json';
                        a.click();
                        setShowActionsDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-blue-600 hover:text-white cursor-pointer flex items-center gap-2"
                    >
                      <span>📥</span>
                      <span>Exporter Monocle DAG (JSON)</span>
                    </div>
                    <div
                      onClick={() => { setActiveModal('hoh_info'); setShowActionsDropdown(false); }}
                      className="px-3 py-2 hover:bg-blue-600 hover:text-white cursor-pointer flex items-center gap-2 border-t border-slate-700"
                    >
                      <span>🧬</span>
                      <span>Harness-of-Harness (HoH) Doc</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => useShell.getState().toggleCms()}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 rounded text-xs font-semibold shadow-sm flex items-center gap-1"
                title="Inspecter cette ontologie dans le CMS Hiérarchique V2"
              >
                <span>🗂️</span>
                <span>CMS</span>
              </button>

              <button
                onClick={() => setActiveModal('share')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-sm"
              >
                Share
              </button>
            </div>
          </div>
        </header>

        {/* ACTION TOOLBAR */}
        <div className="h-8 px-4 bg-[#141a26] border-b border-[#1f2738] flex items-center justify-between text-xs shrink-0 z-10">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveModal('tools')}
              className="px-2 py-0.5 text-slate-300 hover:text-white hover:bg-[#20293d] rounded text-[11px] font-medium"
            >
              Tools ▾
            </button>
            <button
              onClick={() => {
                setLayoutMode(layoutMode === 'dag' ? 'orthogonal' : layoutMode === 'orthogonal' ? 'compact' : 'dag');
              }}
              className="px-2 py-0.5 text-slate-300 hover:text-white hover:bg-[#20293d] rounded text-[11px] font-medium"
            >
              Layout: <span className="text-blue-400 uppercase font-mono">{layoutMode}</span>
            </button>
            <button
              onClick={() => { setPan({ x: 40, y: 20 }); setZoom(0.85); }}
              className="px-2 py-0.5 text-slate-300 hover:text-white hover:bg-[#20293d] rounded text-[11px]"
            >
              Clean &amp; Align
            </button>
            <button
              onClick={() => setActiveModal('search')}
              className="px-2 py-0.5 text-slate-300 hover:text-white hover:bg-[#20293d] rounded text-[11px] flex items-center gap-1"
            >
              <span>Find</span>
              <span className="text-[10px] text-slate-500 font-mono">⌘F</span>
            </button>
            <button
              onClick={() => setActiveModal('color_editor')}
              className="px-2 py-0.5 text-slate-300 hover:text-white hover:bg-[#20293d] rounded text-[11px]"
            >
              Color Group Editor
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            {actionSuccessMsg && (
              <span className="text-emerald-400 font-bold animate-pulse">
                ✓ {actionSuccessMsg}
              </span>
            )}
            <span
              onClick={() => setActiveModal('color_editor')}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              Show Color Group Editor
            </span>
          </div>
        </div>

        {/* MAIN VIEWPORT SWITCHER */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* VIEW 1: PALANTIR MONOCLE DATA LINEAGE */}
          {activeView === 'lineage' && (
            <div
              className="flex-1 relative overflow-hidden bg-[#0a0d14] cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              <div className="absolute bottom-10 left-4 z-20 flex items-center gap-1 bg-[#141a26]/90 border border-[#232c40] rounded-lg p-1 text-xs font-mono text-slate-300 shadow-xl backdrop-blur">
                <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))} className="px-2 py-0.5 hover:bg-slate-800 rounded font-bold" title="Zoom Out">-</button>
                <span className="px-2">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))} className="px-2 py-0.5 hover:bg-slate-800 rounded font-bold" title="Zoom In">+</button>
                <button onClick={() => { setZoom(0.85); setPan({ x: 40, y: 20 }); }} className="px-2 py-0.5 hover:bg-slate-800 rounded text-[11px]" title="Fit to View">Fit</button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-7 bg-[#0f141f] border-t border-[#1e2637] px-4 flex items-center justify-between text-[10px] text-slate-400 font-mono z-10">
                <div className="flex items-center gap-4">
                  <span onClick={() => setActiveModal('preview')} className="hover:text-slate-200 cursor-pointer">Preview</span>
                  <span onClick={() => setActiveModal('history')} className="hover:text-slate-200 cursor-pointer">History</span>
                  <span onClick={() => setActiveModal('code')} className="hover:text-slate-200 cursor-pointer">&lt;&gt; Code</span>
                  <span onClick={() => setActiveView('mining')} className="hover:text-slate-200 cursor-pointer">Build timeline</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span>●</span>
                    <span>Data health : Optimal (1 681 nds, 0 stale)</span>
                  </span>
                </div>
                <div>A&apos;Space OS V3 · Palantir Monocle Engine · HoH Co-Evolution</div>
              </div>

              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {filteredMonocleNodes.map((source) => {
                    return source.targets.map((tgtId) => {
                      const target = MONOCLE_DAG_NODES.find((n) => n.id === tgtId);
                      if (!target) return null;

                      const startX = source.x + (source.isBox ? 160 : 180);
                      const startY = source.y + 14;
                      const endX = target.x;
                      const endY = target.y + 14;
                      const cX1 = startX + Math.max(40, (endX - startX) * 0.45);
                      const cX2 = endX - Math.max(40, (endX - startX) * 0.45);

                      const lineColor = PALANTIR_COLORS[source.stage]?.hex || '#64748b';

                      return (
                        <g key={`${source.id}-${target.id}`}>
                          <path
                            d={`M ${startX} ${startY} C ${cX1} ${startY}, ${cX2} ${endY}, ${endX} ${endY}`}
                            fill="none"
                            stroke={lineColor}
                            strokeWidth="1.8"
                            strokeOpacity="0.45"
                          />
                          {flowAnimation && (
                            <circle r="2.5" fill={lineColor} opacity="0.9">
                              <animateMotion
                                path={`M ${startX} ${startY} C ${cX1} ${startY}, ${cX2} ${endY}, ${endX} ${endY}`}
                                dur="3.5s"
                                repeatCount="indefinite"
                                begin={`${Math.random() * 2}s`}
                              />
                            </circle>
                          )}
                        </g>
                      );
                    });
                  })}
                </g>
              </svg>

              <div
                className="absolute inset-0 origin-top-left"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
              >
                {filteredMonocleNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const colors = PALANTIR_COLORS[node.stage];

                  if (node.isBox) {
                    return (
                      <div
                        key={node.id}
                        data-node
                        onClick={() => setSelectedNode({ id: node.id, type: 'Ontology Entity', degre: 6, stage: node.stage, rid: node.rid, schema: node.schema })}
                        style={{ transform: `translate(${node.x}px, ${node.y}px)`, width: 170 }}
                        className={`absolute cursor-pointer px-3 py-2 rounded bg-[#0b0f17] border shadow-xl transition-all ${
                          isSelected ? 'border-blue-400 ring-2 ring-blue-500/40' : 'border-[#334155] hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-white font-mono text-[11px] font-bold truncate">
                          <span className="text-slate-400 text-[10px]">■</span>
                          <span>{node.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-1">
                          <span>Ontology</span>
                          <span className="text-emerald-400">● Live</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={node.id}
                      data-node
                      onClick={() => setSelectedNode({ id: node.id, type: node.stage.toUpperCase(), degre: 4, stage: node.stage, rid: node.rid, schema: node.schema })}
                      style={{ transform: `translate(${node.x}px, ${node.y}px)`, width: 210 }}
                      className={`absolute cursor-pointer px-3 py-1.5 rounded-full border shadow-md transition-all flex items-center justify-between ${
                        colors.bg
                      } ${colors.border} ${
                        isSelected ? 'ring-2 ring-white shadow-xl scale-[1.03]' : 'hover:scale-[1.01]'
                      }`}
                    >
                      <span className={`font-semibold text-[11px] truncate mr-2 ${colors.text}`}>
                        {node.label}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-300 shrink-0">
                        {node.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: PALANTIR 5-LAYER FRAMEWORK */}
          {activeView === 'framework' && (
            <div className="flex-1 overflow-y-auto p-8 bg-[#f5f6f8] text-slate-800 space-y-6">
              <div className="text-center space-y-2 pb-4 border-b border-slate-300">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Palantir Ontology Framework</h1>
                <div className="flex items-center justify-center gap-6 text-xs font-medium text-slate-700">
                  <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-[#06b6d4] border border-black inline-block" /> Data Sources</span>
                  <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-[#bae6fd] border border-black inline-block" /> Semantic Layer</span>
                  <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-[#fbcfe8] border border-black inline-block" /> Kinetic Layer</span>
                  <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-[#fef08a] border border-black inline-block" /> AI/Dynamic Layer</span>
                  <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-[#bbf7d0] border border-black inline-block" /> Application Layer</span>
                </div>
              </div>

              <div className="relative max-w-6xl mx-auto space-y-3 pt-2">
                {/* 1. APPLICATION LAYER */}
                <div className="p-6 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center relative min-h-[90px]">
                  <div className="w-36 font-black text-xs text-slate-800 uppercase tracking-wider shrink-0">
                    APPLICATION
                  </div>
                  <div className="flex-1 grid grid-cols-5 gap-4 text-center">
                    {['Workshop', 'Object Views', 'Quiver', 'Vertex', 'NL Interface'].map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div
                          onClick={() => {
                            if (item === 'Vertex') setActiveView('vertex');
                            if (item === 'Quiver') setActiveView('quiver');
                            if (item === 'Workshop') setActiveView('workshop');
                            if (item === 'Object Views') setActiveView('explorer');
                          }}
                          className="w-14 h-14 rounded-full bg-[#86efac] border-2 border-black flex items-center justify-center font-bold text-[11px] text-slate-900 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                        >
                          {item}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ARROWS: Between Application & Dynamic/AI */}
                <div className="grid grid-cols-5 gap-4 px-36 py-1">
                  <div className="flex justify-center" />
                  <div className="flex items-center justify-center gap-2 text-[10px] font-mono">
                    <div className="flex flex-col items-center text-rose-600 font-bold">
                      <span>↓</span>
                      <span className="bg-white border border-slate-300 px-1 rounded shadow-xs text-[9px] text-black">Interface Output</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[10px] font-mono">
                    <div className="flex flex-col items-center text-emerald-600 font-bold">
                      <span className="bg-white border border-slate-300 px-1 rounded shadow-xs text-[9px] text-black">Insight Delivery</span>
                      <span>↑</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[10px] font-mono">
                    <div className="flex flex-col items-center text-rose-600 font-bold">
                      <span>↓</span>
                      <span className="bg-white border border-slate-300 px-1 rounded shadow-xs text-[9px] text-black">Decision Support</span>
                    </div>
                  </div>
                  <div className="flex justify-center" />
                </div>

                {/* 2. DYNAMIC / AI LAYER */}
                <div className="p-6 rounded-xl bg-[#fefce8] border border-[#fef08a] flex items-center relative min-h-[90px]">
                  <div className="w-36 font-black text-xs text-slate-800 uppercase tracking-wider shrink-0">
                    DYNAMIC / AI
                  </div>
                  <div className="flex-1 grid grid-cols-5 gap-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-[#fde047] border-2 border-black flex items-center justify-center font-bold text-[11px] text-slate-900 shadow-sm">
                        LLM
                      </div>
                    </div>
                    <div />
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-[#fde047] border-2 border-black flex items-center justify-center font-bold text-[11px] text-slate-900 shadow-sm">
                        ML Models
                      </div>
                    </div>
                    <div />
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-[#fde047] border-2 border-black flex items-center justify-center font-bold text-[11px] text-slate-900 shadow-sm">
                        Decision Engine
                      </div>
                    </div>
                  </div>
                </div>

                {/* ARROWS: Between Dynamic/AI & Kinetic */}
                <div className="grid grid-cols-5 gap-4 px-36 py-1">
                  <div className="flex justify-center" />
                  <div className="flex items-center justify-center text-[10px] font-mono">
                    <div className="flex items-center gap-1">
                      <span className="text-rose-600 font-bold">↘</span>
                      <span className="bg-white border border-slate-300 px-1 rounded text-[9px] text-black shadow-xs">AI Processing</span>
                      <span className="text-emerald-600 font-bold">↖</span>
                    </div>
                  </div>
                  <div className="flex justify-center" />
                  <div className="flex items-center justify-center text-[10px] font-mono">
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-600 font-bold">↗</span>
                      <span className="bg-white border border-slate-300 px-1 rounded text-[9px] text-black shadow-xs">ML Analysis</span>
                      <span className="text-rose-600 font-bold">↙</span>
                    </div>
                  </div>
                  <div className="flex justify-center" />
                </div>

                {/* 3. KINETIC LAYER */}
                <div className="p-6 rounded-xl bg-[#fdf2f8] border border-[#fbcfe8] flex items-center relative min-h-[90px]">
                  <div className="w-36 font-black text-xs text-slate-800 uppercase tracking-wider shrink-0">
                    KINETIC
                  </div>
                  <div className="flex-1 grid grid-cols-5 gap-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-[#f472b6] border-2 border-black flex items-center justify-center font-bold text-[11px] text-slate-900 shadow-sm">
                        Action Types
                      </div>
                    </div>
                    <div />
                    <div />
                    <div />
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-[#f472b6] border-2 border-black flex items-center justify-center font-bold text-[11px] text-slate-900 shadow-sm">
                        Functions
                      </div>
                    </div>
                  </div>
                </div>

                {/* ARROWS: Between Kinetic & Semantic */}
                <div className="grid grid-cols-5 gap-4 px-36 py-1">
                  <div className="flex justify-center" />
                  <div className="flex justify-center" />
                  <div className="flex items-center justify-center text-[10px] font-mono">
                    <div className="flex flex-col items-center">
                      <span className="text-emerald-600 font-bold">↑</span>
                      <span className="bg-white border border-slate-300 px-1 rounded text-[9px] text-black shadow-xs">Decision Feedback</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center text-[10px] font-mono">
                    <div className="flex flex-col items-center">
                      <span className="text-rose-600 font-bold">↓</span>
                      <span className="bg-white border border-slate-300 px-1 rounded text-[9px] text-black shadow-xs">Action Execution</span>
                    </div>
                  </div>
                  <div className="flex justify-center" />
                </div>

                {/* 4. SEMANTIC LAYER */}
                <div className="p-6 rounded-xl bg-[#f0f9ff] border border-[#bae6fd] flex items-center relative min-h-[90px]">
                  <div className="w-36 font-black text-xs text-slate-800 uppercase tracking-wider shrink-0 leading-tight">
                    SEMANTIC (ONTOLOGY)
                  </div>
                  <div className="flex-1 grid grid-cols-7 gap-3 text-center">
                    {['Employee', 'Machine', 'Order', 'Customer', 'Supplier', 'Properties', 'Link Types'].map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div
                          onClick={() => {
                            setSelectedNode({ id: item.toLowerCase(), type: 'Palantir Object', degre: 8 });
                            setActiveView('explorer');
                          }}
                          className="w-13 h-13 rounded-full bg-[#7dd3fc] border-2 border-black flex items-center justify-center font-bold text-[10px] text-slate-900 shadow-sm cursor-pointer hover:scale-105"
                        >
                          {item}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ARROWS: Between Semantic & Data Sources */}
                <div className="grid grid-cols-7 gap-3 px-36 py-1">
                  <div className="flex justify-center" />
                  <div className="flex items-center justify-center text-[9px] font-mono">
                    <div className="flex flex-col items-center">
                      <span className="text-emerald-600 font-bold">↑</span>
                      <span className="bg-white border border-slate-300 px-1 rounded text-[8px] text-black shadow-xs">Real-time Mapping</span>
                    </div>
                  </div>
                  <div className="flex justify-center" />
                  <div className="flex items-center justify-center text-[9px] font-mono">
                    <div className="flex flex-col items-center">
                      <span className="text-rose-600 font-bold">↓</span>
                      <span className="bg-white border border-slate-300 px-1 rounded text-[8px] text-black shadow-xs">Real-time Mapping</span>
                    </div>
                  </div>
                  <div className="flex justify-center" />
                  <div className="flex items-center justify-center text-[9px] font-mono">
                    <div className="flex flex-col items-center">
                      <span className="text-rose-600 font-bold">↓</span>
                      <span className="bg-white border border-slate-300 px-1 rounded text-[8px] text-black shadow-xs">Real-time Mapping</span>
                    </div>
                  </div>
                  <div className="flex justify-center" />
                </div>

                {/* 5. DATA SOURCES LAYER */}
                <div className="p-6 rounded-xl bg-[#ecfeff] border border-[#a5f3fc] flex items-center relative min-h-[90px]">
                  <div className="w-36 font-black text-xs text-slate-800 uppercase tracking-wider shrink-0">
                    DATA SOURCES
                  </div>
                  <div className="flex-1 grid grid-cols-6 gap-3 text-center">
                    {['ERP Systems', 'IoT Sensors', 'CRM Platforms', 'Data Lakes', 'External APIs', 'Spreadsheets'].map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className="w-13 h-13 rounded-full bg-[#22d3ee] border-2 border-black flex items-center justify-center font-bold text-[10px] text-slate-900 shadow-sm">
                          {item}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: PROCESS MINING & EXPLORER */}
          {activeView === 'mining' && (
            <div className="flex-1 flex overflow-hidden bg-[#fafbfc] text-slate-800">
              <div className="w-72 bg-[#ffffff] border-r border-slate-200 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 shadow-sm text-xs">
                <div className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">Filters</div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 uppercase">Reported Date</div>
                  <div className="h-16 flex items-end gap-1 bg-slate-50 p-2 rounded border border-slate-200">
                    {[50, 60, 62, 65, 80, 70, 75, 68, 65, 62, 60, 45].map((h, i) => (
                      <div key={i} className="flex-1 bg-[#3b82f6] rounded-t-xs hover:bg-blue-600 transition-colors" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Aug</span>
                    <span>Sep</span>
                    <span>Oct</span>
                    <span>Nov</span>
                  </div>
                  <div className="text-[10px] text-slate-400 text-center font-mono">2026</div>

                  <div className="flex items-center gap-2 pt-1">
                    <input type="text" placeholder="Start date" defaultValue="2026-08-01" className="w-1/2 px-2 py-1 border border-slate-300 rounded text-[11px] font-mono" />
                    <input type="text" placeholder="End date" defaultValue="2026-11-30" className="w-1/2 px-2 py-1 border border-slate-300 rounded text-[11px] font-mono" />
                  </div>
                </div>

                <div className="h-[1px] bg-slate-200" />

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase">Type</div>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Missing Bonding...', count: 154, width: '90%' },
                      { label: 'Misaligned Rh doo...', count: 153, width: '88%' },
                      { label: 'No value', count: 150, width: '85%' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={miningTypeFilter[item.label] ?? false}
                            onChange={(e) => setMiningTypeFilter({ ...miningTypeFilter, [item.label]: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600"
                          />
                          <span className="truncate w-28 text-slate-700">{item.label}</span>
                        </label>
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span>{item.count}</span>
                          <div className="w-12 h-2.5 bg-blue-100 rounded-xs overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-xs" style={{ width: item.width }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-[1px] bg-slate-200" />

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase">Number Transitions</div>
                  <div className="h-16 flex items-end gap-1 bg-slate-50 p-2 rounded border border-slate-200">
                    {[100, 60, 30, 15, 8, 4, 2, 1, 1, 0, 0, 0].map((h, i) => (
                      <div key={i} className="flex-1 bg-[#2563eb] rounded-t-xs" style={{ height: `${h}%` }} />
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-1/2">
                      <div className="text-[9px] text-slate-500">Min value</div>
                      <input type="number" defaultValue={1} className="w-full px-2 py-0.5 border border-slate-300 rounded font-mono text-[11px]" />
                    </div>
                    <div className="w-1/2">
                      <div className="text-[9px] text-slate-500">Max value</div>
                      <input type="number" defaultValue={45} className="w-full px-2 py-0.5 border border-slate-300 rounded font-mono text-[11px]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden bg-[#fafbfc]">
                <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Process Mining | Non Conformities</div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Welcome back</span>
                      <span>👋</span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-3">
                      <span className="text-2xl font-black text-rose-600 font-mono">140</span>
                      <div className="text-[11px] leading-tight text-slate-700">
                        <div className="font-bold text-slate-900">Alerts assigned to you</div>
                        <div className="text-slate-500 font-mono">678 Open</div>
                      </div>
                      <span className="text-slate-400 text-xs">ℹ️</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="p-1 rounded hover:bg-slate-100 text-slate-600 font-bold">&lt;</button>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Discover</div>
                      <div className="text-sm font-bold text-slate-900">Process Explorer</div>
                    </div>

                    <div className="flex items-center gap-1 ml-4 border-b-2 border-blue-600 pb-1">
                      <button
                        onClick={() => setSelectedMiningTab('overview')}
                        className={`text-xs font-bold ${selectedMiningTab === 'overview' ? 'text-blue-600' : 'text-slate-500'}`}
                      >
                        Process Overview
                      </button>
                    </div>
                    <div className="flex items-center gap-1 ml-2 pb-1">
                      <button
                        onClick={() => setSelectedMiningTab('single')}
                        className={`text-xs font-medium ${selectedMiningTab === 'single' ? 'text-blue-600' : 'text-slate-500'}`}
                      >
                        Single View
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alert('Expected Path reconfiguré selon les baux uc.db.')}
                      className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-slate-700 shadow-xs flex items-center gap-1.5"
                    >
                      <span>🔄</span>
                      <span>Change Expected Path</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 relative overflow-auto p-8 bg-[#fafbfc]">
                  <div className="absolute top-6 left-6 z-20 w-64 bg-white rounded-xl border border-slate-200 shadow-xl p-3.5 space-y-2">
                    <div className="text-[11px] font-bold text-slate-800">Show Additional Transitions</div>
                    <div className="text-[10px] text-slate-500">based on highest:</div>
                    <select className="w-full text-[11px] p-1.5 border border-slate-300 rounded bg-slate-50 font-medium">
                      <option>Number of Transitions ▾</option>
                      <option>Average Duration ▾</option>
                    </select>

                    <div className="pt-2">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-1">
                        <span>Expected Transitions</span>
                        <span>➔ Full Graph</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="45"
                        value={transitionThreshold}
                        onChange={(e) => setTransitionThreshold(Number(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                      <div className="text-center font-mono text-[10px] text-blue-600 font-bold">{transitionThreshold}</div>
                    </div>
                  </div>

                  <div className="min-w-[1000px] min-h-[600px] relative mt-12 ml-48">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                      <defs>
                        <marker id="arrow-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                          <polygon points="0 0, 6 3, 0 6" fill="#059669" />
                        </marker>
                        <marker id="arrow-slate" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                          <polygon points="0 0, 6 3, 0 6" fill="#64748b" />
                        </marker>
                      </defs>

                      <path d="M 170 40 C 220 70, 220 120, 260 140" fill="none" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-green)" />
                      <text x="210" y="80" fill="#059669" fontSize="10" fontFamily="monospace" fontWeight="bold">20%</text>

                      <path d="M 170 30 C 400 30, 700 30, 820 40" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrow-slate)" />
                      <text x="500" y="26" fill="#64748b" fontSize="10" fontFamily="monospace">16%</text>

                      <path d="M 430 160 C 470 170, 480 180, 520 190" fill="none" stroke="#059669" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-green)" />
                      <text x="460" y="165" fill="#059669" fontSize="10" fontFamily="monospace" fontWeight="bold">83.17%</text>

                      <path d="M 690 220 C 720 240, 730 260, 750 300" fill="none" stroke="#059669" strokeWidth="1.8" strokeDasharray="3 3" markerEnd="url(#arrow-green)" />
                      <text x="730" y="250" fill="#059669" fontSize="10" fontFamily="monospace" fontWeight="bold">30%</text>

                      <path d="M 690 190 C 740 140, 780 100, 820 60" fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="4 4" markerEnd="url(#arrow-slate)" />
                      <text x="750" y="120" fill="#64748b" fontSize="10" fontFamily="monospace">9%</text>

                      <path d="M 690 200 C 740 200, 780 200, 820 200" fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="4 4" markerEnd="url(#arrow-slate)" />
                      <text x="750" y="195" fill="#64748b" fontSize="10" fontFamily="monospace">18%</text>

                      <path d="M 850 350 C 870 380, 880 400, 900 420" fill="none" stroke="#059669" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-green)" />
                      <text x="880" y="380" fill="#059669" fontSize="10" fontFamily="monospace" fontWeight="bold">76%</text>

                      <path d="M 850 310 C 880 250, 890 150, 890 80" fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="4 4" markerEnd="url(#arrow-slate)" />
                      <text x="870" y="180" fill="#64748b" fontSize="10" fontFamily="monospace">10%</text>

                      <path d="M 890 180 C 890 140, 890 110, 890 80" fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="4 4" markerEnd="url(#arrow-slate)" />
                      <text x="895" y="130" fill="#64748b" fontSize="10" fontFamily="monospace">5%</text>
                    </svg>

                    <div className="absolute left-0 top-0 w-48 rounded border border-emerald-700 bg-white shadow-md">
                      <div className="bg-[#064e3b] text-white px-2 py-0.5 text-[10px] font-bold">Open</div>
                      <div className="p-2 text-[10px] space-y-0.5">
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="font-bold">Count :</span> 51 Objects</div>
                        <div className="text-slate-500 font-mono text-[9px]">Average Duration : 3,856.49 Hours</div>
                      </div>
                    </div>

                    <div className="absolute left-64 top-28 w-48 rounded border border-emerald-700 bg-white shadow-md">
                      <div className="bg-[#064e3b] text-white px-2 py-0.5 text-[10px] font-bold">Submitted</div>
                      <div className="p-2 text-[10px] space-y-0.5">
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="font-bold">Count :</span> 61 Objects</div>
                        <div className="text-slate-500 font-mono text-[9px]">Average Duration : 2,426.13 Hours</div>
                      </div>
                    </div>

                    <div className="absolute left-[480px] top-44 w-52 rounded border border-rose-700 bg-white shadow-md">
                      <div className="bg-[#991b1b] text-white px-2 py-0.5 text-[10px] font-bold flex justify-between">
                        <span>Assigned</span>
                        <span className="text-[9px] bg-black/40 px-1 rounded">Alert</span>
                      </div>
                      <div className="p-2 text-[10px] space-y-0.5">
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /><span className="font-bold">Count :</span> 107 Objects</div>
                        <div className="text-slate-500 font-mono text-[9px]">Average Duration : 2,733.71 Hours</div>
                      </div>
                    </div>

                    <div className="absolute left-[700px] top-72 w-52 rounded border border-emerald-700 bg-white shadow-md">
                      <div className="bg-[#064e3b] text-white px-2 py-0.5 text-[10px] font-bold">Dispositioned</div>
                      <div className="p-2 text-[10px] space-y-0.5">
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="font-bold">Count :</span> 219 Objects</div>
                        <div className="text-slate-500 font-mono text-[9px]">Average Duration : 2,269.83 Hours</div>
                      </div>
                    </div>

                    <div className="absolute left-[850px] top-[400px] w-44 rounded border border-slate-500 bg-white shadow-md">
                      <div className="bg-[#1e293b] text-white px-2 py-0.5 text-[10px] font-bold">Closed</div>
                      <div className="p-2 text-[10px] space-y-0.5">
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-500" /><span className="font-bold">Count :</span> Done</div>
                        <div className="text-slate-500 font-mono text-[9px]">Average Duration (current)</div>
                      </div>
                    </div>

                    <div className="absolute left-[820px] top-6 w-48 rounded border border-slate-600 bg-white shadow-md">
                      <div className="bg-[#334155] text-white px-2 py-0.5 text-[10px] font-bold">Canceled</div>
                      <div className="p-2 text-[10px] space-y-0.5">
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-500" /><span className="font-bold">Count :</span> 188 Objects</div>
                        <div className="text-slate-500 font-mono text-[9px]">Average Duration : 2,488.18 Hours</div>
                      </div>
                    </div>

                    <div className="absolute left-[820px] top-44 w-48 rounded border border-slate-500 bg-white shadow-md">
                      <div className="bg-[#475569] text-white px-2 py-0.5 text-[10px] font-bold">Reassessed Opened</div>
                      <div className="p-2 text-[10px] space-y-0.5">
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-500" /><span className="font-bold">Count :</span> 20 Objects</div>
                        <div className="text-slate-500 font-mono text-[9px]">Average Duration : 2,002.66 Hours</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: PALANTIR OBJECT EXPLORER */}
          {activeView === 'explorer' && (
            <div className="flex-1 flex flex-col overflow-hidden p-6 bg-[#0a0d14] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Palantir Object Explorer · Référentiel Semantica</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                      {graphData ? `${graphData.nodes.length} Entités Réelles` : '1 681 Entités'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Navigation tabulaire et inspection approfondie de tous les nœuds ontologiques</p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrer entité, concept, loi..."
                    className="w-64 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => setActiveModal('create_object')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                  >
                    + Nouvel Objet
                  </button>
                </div>
              </div>

              {/* Table of Objects */}
              <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-[#0e121a]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141924] border-b border-slate-800 text-slate-400 font-semibold sticky top-0">
                    <tr>
                      <th className="p-3">IDENTIFIANT OBJET</th>
                      <th className="p-3">CLASSE SÉMANTIQUE</th>
                      <th className="p-3">CONNECTIVITÉ (DEGRÉ)</th>
                      <th className="p-3">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {graphData?.nodes
                      ?.filter((n) => {
                        if (!searchQuery) return true;
                        return n.id.toLowerCase().includes(searchQuery.toLowerCase()) || n.type.toLowerCase().includes(searchQuery.toLowerCase());
                      })
                      .slice(0, 100)
                      .map((n) => (
                        <tr
                          key={n.id}
                          onClick={() => setSelectedNode({ ...n, stage: 'ontology' })}
                          className={`hover:bg-slate-800/40 cursor-pointer ${selectedNode?.id === n.id ? 'bg-blue-950/40 text-blue-200' : ''}`}
                        >
                          <td className="p-3 font-bold text-white">{n.id}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                              {n.type}
                            </span>
                          </td>
                          <td className="p-3 text-cyan-400">{n.degre} relations</td>
                          <td className="p-3">
                            <button className="text-xs text-blue-400 hover:text-white">Inspecter →</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 5: PALANTIR CONTOUR */}
          {activeView === 'contour' && (
            <div className="flex-1 flex flex-col overflow-hidden p-6 bg-[#0a0d14] space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Palantir Contour · Workspace des Chemins Analytiques</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                      Contour v2.4 (Foundry)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Agrégations multi-tableaux, calculs de cohortes stratégiques et extraction de sous-graphes
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Filtrer par classe :</span>
                  <select
                    value={selectedContourClass}
                    onChange={(e) => setSelectedContourClass(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
                  >
                    <option value="all">Toutes les classes</option>
                    <option value="sujet">Sujets (Agents &amp; Entités Actives)</option>
                    <option value="entite">Entités Subordonnées</option>
                    <option value="concept">Concepts Sémantiques</option>
                    <option value="loi">Lois Constitutionnelles</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#0e121a] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                    <span>BOARD 1 · FILTER &amp; POPULATION</span>
                    <span className="text-emerald-400 font-mono">● Active Path</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Population Totale</div>
                      <div className="text-xl font-bold text-white font-mono mt-1">1 681</div>
                      <div className="text-[10px] text-slate-500">Nœuds Semantica</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Relations Triplet</div>
                      <div className="text-xl font-bold text-cyan-400 font-mono mt-1">1 446</div>
                      <div className="text-[10px] text-slate-500">Arcs orientés</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Degré Médian</div>
                      <div className="text-xl font-bold text-purple-400 font-mono mt-1">3.4</div>
                      <div className="text-[10px] text-slate-500">Densité Graphe</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0e121a] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                    <span>BOARD 2 · DISTRIBUTION DE CONNECTIVITÉ</span>
                    <span className="text-blue-400 font-mono text-[10px]">Histogramme Palantir</span>
                  </div>
                  <div className="space-y-2 pt-1 font-mono text-xs">
                    {[
                      { range: '1 - 2 relations', count: 1472, pct: 87.5, color: 'bg-blue-600' },
                      { range: '3 - 5 relations', count: 150, pct: 8.9, color: 'bg-emerald-600' },
                      { range: '6 - 10 relations', count: 38, pct: 2.2, color: 'bg-purple-600' },
                      { range: '11 - 20 relations', count: 14, pct: 0.8, color: 'bg-amber-600' },
                      { range: '21+ relations (Hubs)', count: 7, pct: 0.4, color: 'bg-rose-600' },
                    ].map((b, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300">{b.range}</span>
                          <span className="text-slate-400">{b.count} nœuds ({b.pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                          <div className={`h-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0e121a] border border-slate-800 space-y-3 xl:col-span-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                    <span>BOARD 3 · COHORTE DES TOP HUBS STRATÉGIQUES (CENTRALITÉ SÉMANTIQUE)</span>
                    <button
                      onClick={() => alert('Export de la cohorte Contour vers Action Type Palantir.')}
                      className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px]"
                    >
                      Exporter vers Action Type
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="pb-2">RANG</th>
                          <th className="pb-2">IDENTIFIANT DU HUB</th>
                          <th className="pb-2">CLASSE SÉMANTIQUE</th>
                          <th className="pb-2">DEGRÉ DE CENTRALITÉ</th>
                          <th className="pb-2">IMPACT ARCHITECTURAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {[
                          { rank: '#1', id: 'life-os', type: 'entite', degre: 52, impact: 'Pivot Suprême Domaine Vital' },
                          { rank: '#2', id: 'beth', type: 'sujet', degre: 47, impact: 'Garde des Portes Irréversibles' },
                          { rank: '#3', id: 'business-os', type: 'entite', degre: 31, impact: 'Gouvernance SOB & Croissance' },
                          { rank: '#4', id: 'rick', type: 'sujet', degre: 29, impact: 'Loi L0 & Auto-Réplication' },
                          { rank: '#5', id: 'morty', type: 'sujet', degre: 28, impact: 'Opérateur Défaillances & Éveil' },
                          { rank: '#6', id: 'cerritos', type: 'entite', degre: 23, impact: 'Vaisseau Support & Plomberie' },
                          { rank: '#7', id: 'jerry', type: 'sujet', degre: 22, impact: 'Basse Énergie & Frictions' },
                          { rank: '#8', id: 'tech-os', type: 'entite', degre: 19, impact: 'Noyau Runtime & SQLite uc.db' },
                        ].map((hub) => (
                          <tr
                            key={hub.id}
                            onClick={() => {
                              setSelectedNode({ id: hub.id, type: hub.type, degre: hub.degre });
                              setActiveView('explorer');
                            }}
                            className="hover:bg-slate-800/40 cursor-pointer"
                          >
                            <td className="py-2 text-slate-500">{hub.rank}</td>
                            <td className="py-2 font-bold text-white">{hub.id}</td>
                            <td className="py-2">
                              <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] border border-purple-800">
                                {hub.type}
                              </span>
                            </td>
                            <td className="py-2 text-cyan-400 font-bold">{hub.degre} relations</td>
                            <td className="py-2 text-slate-400">{hub.impact}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: PALANTIR VERTEX (AIP PLATFORM) */}
          {activeView === 'vertex' && (
            <div className="flex-1 flex overflow-hidden bg-[#0a0d14]">
              <div className="w-80 bg-[#0e121a] border-r border-[#1e2535] p-4 flex flex-col gap-4 overflow-y-auto shrink-0 shadow-lg">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  AIP Ontology Grounding
                </div>

                <div className="space-y-2 text-xs">
                  <div className="text-[11px] text-slate-400">Objets d&apos;Ancrage Actifs :</div>
                  {[
                    { name: 'SemanticaEntity (1 681)', desc: 'Graphe RDF et prédicats' },
                    { name: 'WorkItem (uc.db)', desc: 'Baux, statuts et événements' },
                    { name: 'Subagent (14 ouvriers)', desc: 'Compagnons & Docteurs' },
                    { name: 'NonConformityAlert', desc: 'Dérives SLA et intégrité' },
                  ].map((obj, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-white text-[11px]">
                        <span>{obj.name}</span>
                        <span className="text-emerald-400 text-[9px] font-mono">● Grounded</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{obj.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-800 pt-3 space-y-2">
                  <div className="text-[11px] font-bold text-slate-300">Modèles d&apos;Inférence Associés :</div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                    <span>Gemini 1.5 Pro / Flash</span>
                    <span className="text-emerald-400">Active</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                    <span>Claude 3.7 Sonnet</span>
                    <span className="text-emerald-400">Ready</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/60 text-[10px] text-blue-300">
                  <span className="font-bold">Invariant AIP :</span> Les actions générées par le modèle ne modifient le système qu&apos;après validation formelle de schéma par l&apos;OSDK.
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Palantir Vertex · AIP Workbench</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                        AIP Agent Grounding
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Raisonnement LLM ancré directement sur l&apos;Ontologie, traduction en requêtes OSDK et exécution d&apos;Action Types
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setAipViewTab('chat')}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        aipViewTab === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Prompt Workbench
                    </button>
                    <button
                      onClick={() => setAipViewTab('code')}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        aipViewTab === 'code' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Python OSDK Generator
                    </button>
                  </div>
                </div>

                {aipViewTab === 'chat' ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Requêtes Préréglées :</span>
                      {[
                        'Analyse les hubs critiques de Tech OS',
                        'Vérifie les dérives SLA de la file uc.db',
                        'Propose une action d\'ajout pour le sous-domaine AI',
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setAipPrompt(chip); handleRunAip(chip); }}
                          className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 rounded-xl bg-[#0e121a] border border-slate-800 space-y-3 shadow-lg">
                      <textarea
                        rows={3}
                        value={aipPrompt}
                        onChange={(e) => setAipPrompt(e.target.value)}
                        placeholder="Posez une question analytique ou formulez une mutation à appliquer à l'Ontologie..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">
                          Contrat : Réponse enrichie d&apos;Action Types validés
                        </span>
                        <button
                          onClick={() => handleRunAip()}
                          disabled={aipLoading}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md flex items-center gap-2"
                        >
                          <span>{aipLoading ? '⏳ Inférence...' : '⚡ Exécuter Inférence AIP'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto rounded-xl bg-[#0e121a] border border-slate-800 p-5 space-y-4">
                      {aipLoading && (
                        <div className="flex items-center justify-center py-12 text-slate-400 space-y-2 flex-col">
                          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                          <div className="text-xs font-mono">Palantir AIP interroge le substrat ontologique...</div>
                        </div>
                      )}

                      {!aipLoading && aipResponse && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-purple-400">
                              <span>SYNTHÈSE DU RAISONNEMENT AIP</span>
                              <span className="text-[10px] font-mono text-slate-400">Confiance : 94%</span>
                            </div>
                            <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                              {aipResponse.aipResponse}
                            </p>
                          </div>

                          {aipResponse.suggestedAction && (
                            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/80 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <span>⚡</span>
                                  <span>Action Type OSDK Déduite</span>
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900 text-emerald-200">
                                  Validation OSDK Requise
                                </span>
                              </div>

                              <div className="font-mono text-xs text-slate-300 bg-black/40 p-3 rounded-lg overflow-x-auto">
                                <pre>{JSON.stringify(aipResponse.suggestedAction, null, 2)}</pre>
                              </div>

                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  onClick={() => {
                                    handleApplyAction(
                                      aipResponse.suggestedAction.actionType,
                                      aipResponse.suggestedAction.payload
                                    );
                                  }}
                                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5"
                                >
                                  <span>✓</span>
                                  <span>Appliquer l&apos;Action Type OSDK</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {!aipLoading && !aipResponse && (
                        <div className="text-center py-16 text-slate-500 space-y-1 font-mono">
                          <div>Aucune inférence en attente.</div>
                          <div className="text-xs text-slate-600">Sélectionnez une requête préconfigurée ou formulez votre demande.</div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Code Generator Tab */
                  <div className="flex-1 overflow-y-auto p-5 rounded-xl bg-[#0e121a] border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">Générateur de Code Palantir OSDK (@osdk/client &amp; Python)</h3>
                        <p className="text-xs text-slate-400">Exemple de code prêt à l&apos;emploi pour interagir avec l&apos;Ontologie V3 en Python</p>
                      </div>
                      <button
                        onClick={() => {
                          const code = `# Palantir Foundry Python OSDK Engine (A'Space V3)\nfrom foundry.v2 import FoundryClient\n\nclient = FoundryClient(auth={'type': 'bearer', 'token': 'aspace_l0_token'})\n\n# 1. Query Semantica Entities\nentities = client.ontology.objects.SemanticaEntity.take(10)\nfor e in entities:\n    print(f"{e.id} ({e.type}) - Degré: {e.degre}")\n\n# 2. Execute Action Type\nclient.ontology.actions.createOntologyObject(\n    id="concept:agentic_workflow",\n    type="concept",\n    predicate="partOf",\n    target="aspace:L0_Tech_OS_Kernel"\n)`;
                          navigator.clipboard?.writeText(code);
                          alert('Code copié dans le presse-papiers.');
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold"
                      >
                        Copier le Code Python OSDK
                      </button>
                    </div>

                    <pre className="p-4 rounded-lg bg-black/60 border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
{`# Palantir Foundry Python OSDK Engine (A'Space V3)
# Conforme à https://github.com/palantir/foundry-platform-python

from foundry.v2 import FoundryClient

# Initialisation du client OSDK sur le substrat V3
client = FoundryClient(
    host="http://127.0.0.1:5555",
    auth={'type': 'local_token', 'token': 'aspace_l0_sovereign'}
)

# 1. Interrogation des Objets Ontologiques Semantica (1 681 Entités)
entities = client.ontology.objects.SemanticaEntity.filter(
    lambda e: e.degre > 10
).take(5)

for e in entities:
    print(f"Hub identifié: {e.id} | Classe: {e.type} | Centralité: {e.degre}")

# 2. Application d'une Action Type validée formellement
response = client.ontology.actions.createOntologyObject(
    id="concept:hoh_meta_loop",
    type="concept",
    predicate="relatesTo",
    target="aspace:10_Tech_OS_Harness"
)

print("Statut mutation:", response.status)`}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 7: WORKSHOP (COCKPIT OPÉRATIONNEL PALANTIR) */}
          {activeView === 'workshop' && (
            <div className="flex-1 overflow-y-auto p-6 bg-[#0a0d14] space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Palantir Workshop · Cockpit Opérationnel &amp; Baux uc.db</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                      Live Operations
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Application opérationnelle construite sur l&apos;Ontologie pour orchestrer la file de travail et les baux
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyAction('triggerWorkflowPipeline', { pipelineId: 'dark_factory', dryRun: true })}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>Déclencher Dark Factory</span>
                  </button>
                </div>
              </div>

              {/* KPI Gauges */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#0e121a] border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Tickets dans uc.db</div>
                  <div className="text-2xl font-black text-white font-mono">678</div>
                  <div className="text-[10px] text-slate-500 font-mono">51 En attente d&apos;admission</div>
                </div>
                <div className="p-4 rounded-xl bg-[#0e121a] border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Baux Temporels Actifs</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">4</div>
                  <div className="text-[10px] text-slate-500 font-mono">Zéro bail stale / orphelin</div>
                </div>
                <div className="p-4 rounded-xl bg-[#0e121a] border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Conformité SLA Palantir</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">98.6%</div>
                  <div className="text-[10px] text-slate-500 font-mono">Temps cycle médian 4.6h</div>
                </div>
                <div className="p-4 rounded-xl bg-[#0e121a] border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Subagents Connectés</div>
                  <div className="text-2xl font-black text-purple-400 font-mono">14 / 14</div>
                  <div className="text-[10px] text-slate-500 font-mono">Roster opérationnel prêt</div>
                </div>
              </div>

              {/* Live Operational Tasks Board */}
              <div className="p-5 rounded-xl bg-[#0e121a] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">File d&apos;Exécution Prioritaire (Workshop Live Grid)</h3>
                  <span className="text-[10px] font-mono text-slate-400">Source : uc.db WAL</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="pb-2">ID</th>
                        <th className="pb-2">TITRE DU TICKET</th>
                        <th className="pb-2">SUBAGENT ASSIGNÉ</th>
                        <th className="pb-2">STATUT DU BAIL</th>
                        <th className="pb-2">ACTION OSDK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {[
                        { id: 101, title: 'Consolidation Hebdomadaire Ontologie Semantica', agent: 'companion_graham_memory', status: 'lease_active', duration: '58 min restantes' },
                        { id: 102, title: 'Audit Sécurité RLS & Pragma Integrity Check', agent: 'companion_rory_backend', status: 'lease_active', duration: '12 min restantes' },
                        { id: 103, title: 'Cartographie Dynamique du Corpus V3', agent: 'doctor_13_kernel', status: 'lease_active', duration: '24 min restantes' },
                        { id: 104, title: 'Compilation Ryan CI/CD tsc --noEmit', agent: 'companion_ryan_builder', status: 'lease_active', duration: '4 min restantes' },
                      ].map((row) => (
                        <tr key={row.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 text-slate-500">#{row.id}</td>
                          <td className="py-2.5 text-white font-bold">{row.title}</td>
                          <td className="py-2.5 text-purple-400">{row.agent}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              {row.status} ({row.duration})
                            </span>
                          </td>
                          <td className="py-2.5">
                            <button
                              onClick={() => handleApplyAction('dispatchWorkItem', { workItemId: row.id, agentId: row.agent })}
                              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px]"
                            >
                              Prolonger Bail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 8: QUIVER (ANALYSE DE GRAPHE & PATHFINDING) */}
          {activeView === 'quiver' && (
            <div className="flex-1 overflow-y-auto p-6 bg-[#0a0d14] space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Palantir Quiver · Analyse de Graphe &amp; Calculs de Chemins</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                      Graph Analytics v2.4
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Recherche de plus court chemin sémantique, analyse de connectivité et détection de ponts
                  </p>
                </div>
              </div>

              {/* Pathfinding Card */}
              <div className="p-5 rounded-xl bg-[#0e121a] border border-slate-800 space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Recherche de Plus Court Chemin (Shortest Path Finding)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Nœud Source :</label>
                    <input
                      type="text"
                      value={quiverSource}
                      onChange={(e) => setQuiverSource(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded font-mono text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Nœud Cible :</label>
                    <input
                      type="text"
                      value={quiverTarget}
                      onChange={(e) => setQuiverTarget(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded font-mono text-xs text-white"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-black/50 border border-slate-800 font-mono text-xs space-y-2">
                  <div className="text-cyan-400 font-bold">Chemin Identifié (3 Sauts) :</div>
                  <div className="flex items-center gap-2 flex-wrap text-white">
                    <span className="px-2 py-1 bg-blue-950 rounded border border-blue-800">{quiverSource}</span>
                    <span className="text-slate-500 font-bold">--[partOf]--&gt;</span>
                    <span className="px-2 py-1 bg-purple-950 rounded border border-purple-800">aspace:L0_Tech_OS_Kernel</span>
                    <span className="text-slate-500 font-bold">--[coordinatesWith]--&gt;</span>
                    <span className="px-2 py-1 bg-emerald-950 rounded border border-emerald-800">aspace:30_Business_OS</span>
                    <span className="text-slate-500 font-bold">--[manages]--&gt;</span>
                    <span className="px-2 py-1 bg-blue-950 rounded border border-blue-800">{quiverTarget}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1">
                    Confiance RDF : 100% (Arcs certifiés dans semantica_knowledge_graph.json)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RIGHT PALANTIR OBJECT / DATASET INSPECTOR */}
          {selectedNode && (
            <aside className="w-80 bg-[#0e121a] border-l border-[#1e2535] p-4 flex flex-col justify-between overflow-y-auto shrink-0 shadow-2xl z-30">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dataset Inspector</span>
                  <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white">✕</button>
                </div>

                {/* Tab Switcher in Inspector */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px] font-mono">
                  <button
                    onClick={() => setActiveInspectorTab('overview')}
                    className={`flex-1 py-1 rounded ${activeInspectorTab === 'overview' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveInspectorTab('schema')}
                    className={`flex-1 py-1 rounded ${activeInspectorTab === 'schema' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
                  >
                    Schema
                  </button>
                  <button
                    onClick={() => setActiveInspectorTab('preview')}
                    className={`flex-1 py-1 rounded ${activeInspectorTab === 'preview' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
                  >
                    Preview
                  </button>
                </div>

                {activeInspectorTab === 'overview' && (
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">{selectedNode.type}</div>
                      <h3 className="text-sm font-bold text-white mt-0.5 break-all">{selectedNode.id}</h3>
                      <div className="mt-1 text-[9px] font-mono text-slate-500 break-all">
                        {selectedNode.rid || `ri.foundry.main.dataset.${selectedNode.id}`}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                          Degré : {selectedNode.degre}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-semibold border border-emerald-800">
                          Built · Up-to-date
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Relations RDF Liées</h4>
                      <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-[11px]">
                        {nodeRelations.outgoing.map((edge, idx) => (
                          <div key={idx} className="p-2 rounded bg-slate-900/80 border border-slate-800">
                            <div className="text-cyan-400 text-[10px]">--[{edge.predicate}]--&gt;</div>
                            <div className="text-white font-bold truncate">{edge.target}</div>
                            <div className="text-slate-500 text-[9px] mt-1">{edge.provenance}</div>
                          </div>
                        ))}
                        {nodeRelations.incoming.map((edge, idx) => (
                          <div key={idx} className="p-2 rounded bg-slate-900/80 border border-slate-800">
                            <div className="text-amber-400 text-[10px]">&lt;--[{edge.predicate}]--</div>
                            <div className="text-white font-bold truncate">{edge.source}</div>
                            <div className="text-slate-500 text-[9px] mt-1">{edge.provenance}</div>
                          </div>
                        ))}
                        {nodeRelations.outgoing.length === 0 && nodeRelations.incoming.length === 0 && (
                          <div className="p-3 text-center text-slate-500 text-xs">Aucune relation directe trouvée.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeInspectorTab === 'schema' && (
                  <div className="space-y-2 font-mono text-xs">
                    <div className="text-slate-400 text-[11px] mb-2 font-bold">Colonnes et Types de Schéma :</div>
                    {[
                      { name: 'id', type: 'string', pk: true },
                      { name: 'status', type: 'string' },
                      { name: 'timestamp', type: 'timestamp' },
                      { name: 'confidence', type: 'float' },
                      { name: 'payload_json', type: 'struct' },
                    ].map((col, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-white font-bold">{col.name}</span>
                        <span className="text-purple-400 text-[10px]">{col.type}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeInspectorTab === 'preview' && (
                  <div className="space-y-2 font-mono text-[10px]">
                    <div className="text-slate-400 mb-1 font-bold">Échantillon de Données (5 Lignes) :</div>
                    <div className="overflow-x-auto border border-slate-800 rounded">
                      <table className="w-full text-left">
                        <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="p-1.5">ID</th>
                            <th className="p-1.5">STATUT</th>
                            <th className="p-1.5">CONF</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-slate-200">
                          <tr><td className="p-1.5">rec_01</td><td className="p-1.5 text-emerald-400">clean</td><td className="p-1.5">0.99</td></tr>
                          <tr><td className="p-1.5">rec_02</td><td className="p-1.5 text-emerald-400">clean</td><td className="p-1.5">0.98</td></tr>
                          <tr><td className="p-1.5">rec_03</td><td className="p-1.5 text-amber-400">verified</td><td className="p-1.5">0.95</td></tr>
                          <tr><td className="p-1.5">rec_04</td><td className="p-1.5 text-emerald-400">clean</td><td className="p-1.5">0.99</td></tr>
                          <tr><td className="p-1.5">rec_05</td><td className="p-1.5 text-emerald-400">clean</td><td className="p-1.5">1.00</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => {
                    setActiveView('lineage');
                    setCanvasSearch(selectedNode.id);
                  }}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-sm"
                >
                  Centrer dans Monocle Lineage
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* 5. MODALS (TOOLS, SEARCH, CREATE OBJECT, COLOR EDITOR, SHARE, HOH) */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#111622] border border-[#232c40] rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white uppercase tracking-wider">
                {activeModal === 'tools' && 'Foundry Diagnostics & Tools'}
                {activeModal === 'search' && 'Recherche Globale d\'Objets (⌘K)'}
                {activeModal === 'create_object' && 'Créer un Nouvel Objet Ontologique (OSDK)'}
                {activeModal === 'color_editor' && 'Palantir Color Group Editor'}
                {activeModal === 'share' && 'Partager la Vue Ontologique'}
                {activeModal === 'hoh_info' && 'Harness-of-Harness (HoH) Architecture'}
              </span>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white text-base">✕</button>
            </div>

            {/* Modal: Create Object */}
            {activeModal === 'create_object' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Identifiant Unique (URI)</label>
                  <input
                    type="text"
                    value={newObjId}
                    onChange={(e) => setNewObjId(e.target.value)}
                    placeholder="ex: concept:mon_nouveau_module"
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Classe Sémantique</label>
                  <select
                    value={newObjType}
                    onChange={(e) => setNewObjType(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value="concept">Concept Sémantique</option>
                    <option value="entite">Entité Opérationnelle</option>
                    <option value="processus">Processus / Workflow</option>
                    <option value="loi">Loi Constitutionnelle</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Cible de Liaison RDF</label>
                  <input
                    type="text"
                    value={newObjTarget}
                    onChange={(e) => setNewObjTarget(e.target.value)}
                    placeholder="ex: aspace:L0_Tech_OS_Kernel"
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">Annuler</button>
                  <button
                    onClick={() => {
                      handleApplyAction('createOntologyObject', {
                        id: newObjId,
                        type: newObjType,
                        predicate: 'partOf',
                        target: newObjTarget,
                      });
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded"
                  >
                    Créer Objet (OSDK)
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Search */}
            {activeModal === 'search' && (
              <div className="space-y-3">
                <input
                  type="text"
                  autoFocus
                  value={canvasSearch}
                  onChange={(e) => setCanvasSearch(e.target.value)}
                  placeholder="Tapez pour filtrer les nœuds Monocle et objets..."
                  className="w-full p-2.5 bg-slate-900 border border-blue-500 rounded text-xs text-white font-mono"
                />
                <div className="max-h-56 overflow-y-auto space-y-1 font-mono text-[11px]">
                  {MONOCLE_DAG_NODES.filter((n) => !canvasSearch || n.label.toLowerCase().includes(canvasSearch.toLowerCase())).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setSelectedNode({ id: n.id, type: n.stage.toUpperCase(), degre: 4, stage: n.stage, rid: n.rid, schema: n.schema });
                        setActiveModal(null);
                      }}
                      className="p-2 rounded hover:bg-slate-800 cursor-pointer flex items-center justify-between"
                    >
                      <span className="text-white font-bold">{n.label}</span>
                      <span className="text-slate-400 text-[10px]">{n.stage}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal: Tools */}
            {activeModal === 'tools' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="font-bold text-white">Topologie &amp; Métriques Graphe :</div>
                  <div className="text-slate-400">Densité des arcs : 0.86 relations / nœud</div>
                  <div className="text-slate-400">Complexité cyclomatique : Minimale (DAG orienté sans cycles)</div>
                  <div className="text-emerald-400 font-bold">Conformité SLA Palantir : 98.6%</div>
                </div>
                <button onClick={() => setActiveModal(null)} className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded">Fermer</button>
              </div>
            )}

            {/* Modal: Color Editor */}
            {activeModal === 'color_editor' && (
              <div className="space-y-2">
                <p className="text-slate-400 text-xs">Palette et règles de coloration Foundry :</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {Object.entries(PALANTIR_COLORS).map(([key, val]) => (
                    <div key={key} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: val.hex }} />
                      <span className="text-white">{val.tag}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveModal(null)} className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded mt-2">Valider</button>
              </div>
            )}

            {/* Modal: Share */}
            {activeModal === 'share' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-300">Lien direct vers cette instance de l&apos;Ontologie :</p>
                <input readOnly value="http://127.0.0.1:5555/" className="w-full p-2 bg-slate-900 border border-slate-700 rounded font-mono text-cyan-400 text-[11px]" />
                <button onClick={() => { navigator.clipboard?.writeText('http://127.0.0.1:5555/'); alert('Lien copié dans le presse-papiers.'); setActiveModal(null); }} className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded">
                  Copier le Lien
                </button>
              </div>
            )}

            {/* Modal: HoH Info */}
            {activeModal === 'hoh_info' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white text-sm">Harness-of-Harness (HoH - arXiv:2609.01481)</div>
                  <p className="text-slate-300 leading-relaxed">
                    HoH permet l&apos;autonomie multi-jours en découplant l&apos;agent LLM du harnais d&apos;exécution. Le harnais intègre SQLite uc.db, les baux temporels et les spécifications OSDK, permettant au système d&apos;auto-réparer ses propres composants et interfaces sans intervention humaine.
                  </p>
                </div>
                <button onClick={() => setActiveModal(null)} className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded">Fermer</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const App = OnthologyApp;
