import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Activity,
  Brain,
  Heart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Scan,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Stethoscope,
  XRay,
  Waves,
  Eye,
  Thermometer,
  Radio,
  Clock,
  ChevronDown,
  ChevronRight,
  Send,
  Sparkles,
  BarChart3,
  Crosshair,
  Zap,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Volume2,
} from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'
import { Card } from '../../components/common/ui.jsx'
import { ANIMALS, CURATED } from '../../data/mockData.js'
import { detectAnomalies, getDetectionStatus } from '../../services/detectionService.js'
import { toast } from '../../utils/toast.js'
import { playAlertSound } from '../../utils/audio.js'

/* ============================================================
   CONSTANTS & MOCK DATA
   ============================================================ */

const BODY_PARTS = [
  { id: 'head', label: 'Head', icon: '👁' },
  { id: 'eyes', label: 'Eyes', icon: '👁' },
  { id: 'nose', label: 'Nose', icon: '👃' },
  { id: 'neck', label: 'Neck', icon: '🔗' },
  { id: 'body', label: 'Body', icon: '🔲' },
  { id: 'udder', label: 'Udder', icon: '🍑' },
  { id: 'legs', label: 'Legs', icon: '🦴' },
  { id: 'tail', label: 'Tail', icon: '🪝' },
  { id: 'hooves', label: 'Hooves', icon: '👣' },
]

const DISEASE_CONDITIONS = {
  head: [
    { name: 'Listeriosis', confidence: 82, severity: 'high' },
    { name: 'Polioencephalomalacia', confidence: 45, severity: 'medium' },
    { name: 'Brain Abscess', confidence: 33, severity: 'high' },
  ],
  eyes: [
    { name: 'Pinkeye (IBK)', confidence: 91, severity: 'medium' },
    { name: 'Corneal Ulcer', confidence: 67, severity: 'medium' },
    { name: 'Conjunctivitis', confidence: 54, severity: 'low' },
  ],
  nose: [
    { name: 'Nasal Bot Infestation', confidence: 76, severity: 'medium' },
    { name: 'Bovine Respiratory Disease', confidence: 58, severity: 'high' },
    { name: 'Actinomycosis', confidence: 22, severity: 'medium' },
  ],
  neck: [
    { name: 'Lymph Node Swelling', confidence: 71, severity: 'medium' },
    { name: 'Wry Neck', confidence: 39, severity: 'low' },
  ],
  body: [
    { name: 'Internal Parasitism', confidence: 88, severity: 'high' },
    { name: 'Peritonitis', confidence: 44, severity: 'high' },
    { name: 'Ascites', confidence: 28, severity: 'high' },
  ],
  udder: [
    { name: 'Mastitis (Subclinical)', confidence: 94, severity: 'high' },
    { name: 'Mastitis (Clinical)', confidence: 87, severity: 'high' },
    { name: 'Udder Edema', confidence: 52, severity: 'medium' },
  ],
  legs: [
    { name: 'Digital Dermatitis', confidence: 85, severity: 'medium' },
    { name: 'Lameness (Foul)', confidence: 79, severity: 'medium' },
    { name: 'Osteoarthritis', confidence: 41, severity: 'low' },
  ],
  tail: [
    { name: 'Tail Fracture', confidence: 62, severity: 'low' },
    { name: 'Tail Tip Necrosis', confidence: 38, severity: 'low' },
  ],
  hooves: [
    { name: 'Foot Rot', confidence: 89, severity: 'high' },
    { name: 'Laminitis', confidence: 73, severity: 'high' },
    { name: 'White Line Disease', confidence: 56, severity: 'medium' },
  ],
}

const SYMPTOM_RESPONSES = [
  {
    keywords: ['milk', 'reduced', 'milk output', 'udder', 'swollen', 'mastitis'],
    conditions: [
      { name: 'Clinical Mastitis', confidence: 94, severity: 'critical' },
      { name: 'Subclinical Mastitis', confidence: 87, severity: 'high' },
      { name: 'Udder Edema', confidence: 62, severity: 'moderate' },
    ],
    actions: ['Immediate milk sampling for SCC test', 'Apply cold compress to udder', 'Consult veterinarian for antibiotic therapy'],
    medicines: [{ name: 'Penicillin G Procaine', dose: '10,000 IU/kg IM', duration: '5 days' }, { name: 'Flunixin Meglumine', dose: '2.2 mg/kg IV', duration: '3 days' }],
    vetReferral: true,
    insight: 'High probability of mastitis detected based on reduced milk output and udder swelling. Immediate veterinary intervention recommended.',
  },
  {
    keywords: ['lameness', 'limp', 'leg', 'hoof', 'lame', 'limp', 'not walking'],
    conditions: [
      { name: 'Digital Dermatitis', confidence: 88, severity: 'high' },
      { name: 'Foot Rot (Bacterial)', confidence: 76, severity: 'high' },
      { name: 'Laminitis', confidence: 54, severity: 'moderate' },
    ],
    actions: ['Isolate affected animal', 'Examine hooves for lesions', 'Apply topical antiseptic treatment', 'Provide soft bedding'],
    medicines: [{ name: 'Oxytetracycline Spray', dose: 'Apply topically BID', duration: '7 days' }, { name: 'Flunixin Meglumine', dose: '2.2 mg/kg IV', duration: '3 days' }],
    vetReferral: true,
    insight: 'Lameness detected - likely digital dermatitis or foot rot. Early intervention critical to prevent spread to other animals.',
  },
  {
    keywords: ['fever', 'temperature', 'hot', 'feverish', '39', '40'],
    conditions: [
      { name: 'Bovine Respiratory Disease', confidence: 82, severity: 'critical' },
      { name: 'Septicaemia', confidence: 64, severity: 'critical' },
      { name: 'Brucellosis', confidence: 41, severity: 'high' },
    ],
    actions: ['Take rectal temperature', 'Monitor respiratory rate', 'Check for nasal discharge', 'Ensure hydration'],
    medicines: [{ name: 'Meloxicam', dose: '0.5 mg/kg IM', duration: '3 days' }, { name: 'Oxytetracycline', dose: '10 mg/kg IV', duration: '5 days' }],
    vetReferral: true,
    insight: 'Elevated temperature indicates possible systemic infection. Immediate veterinary consultation recommended.',
  },
  {
    keywords: ['eye', 'eyes', 'discharge', 'pink eye', 'vision', 'blind', 'watery'],
    conditions: [
      { name: 'Infectious Bovine Keratoconjunctivitis (IBK)', confidence: 91, severity: 'moderate' },
      { name: 'Bovine Herpesvirus-1', confidence: 45, severity: 'moderate' },
    ],
    actions: ['Clean eyes with sterile saline', 'Apply topical antibiotic eye ointment', 'Provide shade to reduce UV exposure', 'Isolate to prevent spread'],
    medicines: [{ name: 'Oxytetracycline Eye Ointment', dose: 'Apply q12h', duration: '5-7 days' }, { name: 'Florfenicol', dose: '40 mg/kg SC', duration: '3 days' }],
    vetReferral: false,
    insight: 'Pinkeye (IBK) is highly contagious. Early treatment prevents corneal damage and vision loss.',
  },
  {
    keywords: ['diarrhea', 'dysentery', 'loose stool', 'scours', 'bloody', 'runny'],
    conditions: [
      { name: 'Bovine Viral Diarrhoea', confidence: 78, severity: 'high' },
      { name: 'Salmonellosis', confidence: 69, severity: 'critical' },
      { name: 'Cryptosporidiosis', confidence: 61, severity: 'high' },
    ],
    actions: ['Provide clean drinking water', 'Administer oral rehydration solution', 'Check feed quality', 'Isolate affected animal'],
    medicines: [{ name: 'Oral Rehydration Solution', dose: '2-4 L q8h', duration: '3 days' }, { name: 'Spectinomycin', dose: '7.5-15 mg/kg IM', duration: '5 days' }],
    vetReferral: true,
    insight: 'Diarrhea can indicate serious infectious disease. Hydration is critical. Check for zoonotic risk (Salmonella).',
  },
  {
    keywords: ['bloat', 'distended', 'left side', 'rumen', 'gas'],
    conditions: [
      { name: 'Rumen Tympany (Bloat)', confidence: 93, severity: 'critical' },
      { name: 'Rumen Acidosis', confidence: 48, severity: 'moderate' },
    ],
    actions: ['EMERGENCY: Move animal to standing position', 'Remove feed immediately', 'Emergency veterinarian call', 'Prepare for trocar/rumenotomy if needed'],
    medicines: [{ name: 'Poloxalene', dose: '1 g/kg PO', duration: 'Single dose' }, { name: 'Simethicone', dose: '0.5-1.0 g PO', duration: 'Repeat q30min' }],
    vetReferral: true,
    insight: 'Bloat is a LIFE-THREATENING emergency. Gas accumulation compresses lungs and diaphragm. Immediate action required.',
  },
  {
    keywords: ['cough', 'coughing', 'respiratory', 'breathing', 'pneumonia'],
    conditions: [
      { name: 'Bovine Respiratory Syncytial Virus', confidence: 79, severity: 'high' },
      { name: 'Infectious Bovine Rhinotracheitis', confidence: 71, severity: 'high' },
      { name: 'Bovine Tuberculosis', confidence: 44, severity: 'critical' },
    ],
    actions: ['Check temperature', 'Monitor breathing rate', 'Listen for abnormal lung sounds', 'Isolate from herd'],
    medicines: [{ name: 'Florfenicol', dose: '15-20 mg/kg SC', duration: '3 days' }, { name: 'Flunixin Meglumine', dose: '2.2 mg/kg IV', duration: '3 days' }],
    vetReferral: true,
    insight: 'Respiratory disease can spread rapidly in close housing. Early detection and treatment improve outcomes significantly.',
  },
  {
    keywords: ['appetite', 'not eating', 'anorexia', 'refusing feed', 'decreased'],
    conditions: [
      { name: 'Metabolic Disorders', confidence: 65, severity: 'moderate' },
      { name: 'Johne\'s Disease', confidence: 52, severity: 'high' },
      { name: 'BVD (Bovine Viral Diarrhoea)', confidence: 47, severity: 'high' },
    ],
    actions: ['Check for other symptoms (fever, diarrhea)', 'Monitor rumen motility', 'Ensure fresh feed availability', 'Check dental health'],
    medicines: [{ name: 'Vitamin B Complex', dose: '10-20 mL IM', duration: '3-5 days' }, { name: 'Propylene Glycol', dose: '300 mL PO', duration: 'BID 3 days' }],
    vetReferral: true,
    insight: 'Loss of appetite is a non-specific but important sign. Monitor closely and check for concurrent clinical signs.',
  },
]

const DEFAULT_RESPONSE = {
  conditions: [
    { name: 'General Malaise', confidence: 52, severity: 'moderate' },
    { name: 'Nutritional Deficiency', confidence: 38, severity: 'low' },
    { name: 'Early Subclinical Infection', confidence: 29, severity: 'low' },
  ],
  actions: ['Monitor vital signs (temperature, respiration)', 'Ensure access to clean water and quality feed', 'Observe for 24-48 hours for changes'],
  medicines: [{ name: 'Multivitamin Supplement', dose: 'As per label', duration: '7 days' }],
  vetReferral: false,
  insight: 'Based on the symptoms described, this appears to be a mild condition. Continue monitoring and consult a veterinarian if symptoms worsen or persist beyond 48 hours.',
}

const SCC_DATA = [
  { week: 'W1', value: 85 },
  { week: 'W2', value: 92 },
  { week: 'W3', value: 78 },
  { week: 'W4', value: 145 },
  { week: 'W5', value: 210 },
  { week: 'W6', value: 178 },
  { week: 'W7', value: 165 },
  { week: 'W8', value: 195 },
]

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

// AI Image Analysis Visualizer - Cow Body Diagram
function CowBodyDiagram({ selectedPart, onSelectPart, scanActive }) {
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      {/* Scanning beam animation */}
      {scanActive && (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
          <div
            className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-honey-400 to-transparent shadow-[0_0_20px_rgba(217,119,6,0.6)]"
            style={{
              animation: 'scanBeam 2.5s ease-in-out infinite',
              top: '10%',
            }}
          />
          <style>{`
            @keyframes scanBeam {
              0% { top: 5%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 90%; opacity: 0; }
            }
            @keyframes glowPulse {
              0%, 100% { filter: drop-shadow(0 0 6px rgba(59,158,255,0.5)); }
              50% { filter: drop-shadow(0 0 16px rgba(59,158,255,0.9)); }
            }
            @keyframes ultrasoundSweep {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes countUp {
              from { opacity: 0; transform: scale(0.5); }
              to { opacity: 1; transform: scale(1); }
            }
            @keyframes sparkle {
              0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
              50% { opacity: 1; transform: scale(1) rotate(180deg); }
            }
            @keyframes typing {
              from { width: 0; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      )}

      {/* SVG Cow silhouette */}
      <svg viewBox="0 0 300 280" className="w-full h-auto" style={{ filter: scanActive ? 'none' : 'none' }}>
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5efe0" />
            <stop offset="100%" stopColor="#e8dfd0" />
          </linearGradient>
          <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="40%" stopColor="#3B9EFF" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#3B9EFF" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#3B9EFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="cowClip">
            <path d="M180,40 C200,35 225,38 235,50 C245,62 250,80 248,95 C246,110 240,120 235,125 C250,128 258,138 260,152 C262,166 258,178 250,186 C245,192 238,195 230,196 C228,208 224,218 218,228 C212,238 205,244 196,246 C190,248 182,248 176,244 C170,240 167,234 166,226 C164,230 158,234 150,234 C140,234 134,228 133,220 L132,210 C130,212 126,214 120,214 C110,214 104,208 103,200 C102,192 106,184 114,182 C108,180 104,174 104,166 C104,158 110,152 118,150 C114,148 112,144 112,138 C112,130 118,124 126,122 C122,120 120,116 120,110 C120,102 126,96 134,94 L140,76 C148,78 158,78 168,74 L180,40Z" />
          </clipPath>
        </defs>

        {/* Cow body fill */}
        <path
          d="M180,40 C200,35 225,38 235,50 C245,62 250,80 248,95 C246,110 240,120 235,125 C250,128 258,138 260,152 C262,166 258,178 250,186 C245,192 238,195 230,196 C228,208 224,218 218,228 C212,238 205,244 196,246 C190,248 182,248 176,244 C170,240 167,234 166,226 C164,230 158,234 150,234 C140,234 134,228 133,220 L132,210 C130,212 126,214 120,214 C110,214 104,208 103,200 C102,192 106,184 114,182 C108,180 104,174 104,166 C104,158 110,152 118,150 C114,148 112,144 112,138 C112,130 118,124 126,122 C122,120 120,116 120,110 C120,102 126,96 134,94 L140,76 C148,78 158,78 168,74 L180,40Z"
          fill="url(#bodyGrad)"
          stroke="#d6c9b0"
          strokeWidth="2"
        />

        {/* Cow body parts - clickable regions */}
        {/* Head */}
        <ellipse
          cx="232"
          cy="48"
          rx="16"
          ry="14"
          fill={selectedPart === 'head' ? '#3B9EFF' : 'transparent'}
          stroke={selectedPart === 'head' ? '#3B9EFF' : 'transparent'}
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300"
          style={selectedPart === 'head' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}}
          onClick={() => onSelectPart('head')}
        />

        {/* Eyes */}
        <ellipse
          cx="226"
          cy="42"
          rx="4"
          ry="3"
          fill={selectedPart === 'eyes' ? '#3B9EFF' : 'transparent'}
          stroke={selectedPart === 'eyes' ? '#3B9EFF' : 'transparent'}
          strokeWidth="1.5"
          className="cursor-pointer transition-all duration-300"
          style={selectedPart === 'eyes' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}}
          onClick={() => onSelectPart('eyes')}
        />
        <ellipse
          cx="240"
          cy="42"
          rx="4"
          ry="3"
          fill={selectedPart === 'eyes' ? '#3B9EFF' : 'transparent'}
          stroke={selectedPart === 'eyes' ? '#3B9EFF' : 'transparent'}
          strokeWidth="1.5"
          className="cursor-pointer transition-all duration-300"
          style={selectedPart === 'eyes' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}}
          onClick={() => onSelectPart('eyes')}
        />

        {/* Nose */}
        <ellipse
          cx="233"
          cy="52"
          rx="6"
          ry="5"
          fill={selectedPart === 'nose' ? '#3B9EFF' : 'transparent'}
          stroke={selectedPart === 'nose' ? '#3B9EFF' : 'transparent'}
          strokeWidth="1.5"
          className="cursor-pointer transition-all duration-300"
          style={selectedPart === 'nose' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}}
          onClick={() => onSelectPart('nose')}
        />

        {/* Neck */}
        <rect
          x="212"
          y="56"
          width="20"
          height="30"
          rx="8"
          fill={selectedPart === 'neck' ? '#3B9EFF' : 'transparent'}
          stroke={selectedPart === 'neck' ? '#3B9EFF' : 'transparent'}
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300"
          style={selectedPart === 'neck' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}}
          onClick={() => onSelectPart('neck')}
        />

        {/* Body */}
        <rect
          x="140"
          y="80"
          width="70"
          height="55"
          rx="12"
          fill={selectedPart === 'body' ? '#3B9EFF' : 'transparent'}
          stroke={selectedPart === 'body' ? '#3B9EFF' : 'transparent'}
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300"
          style={selectedPart === 'body' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}}
          onClick={() => onSelectPart('body')}
        />

        {/* Udder */}
        <ellipse
          cx="175"
          cy="145"
          rx="18"
          ry="12"
          fill={selectedPart === 'udder' ? '#3B9EFF' : 'transparent'}
          stroke={selectedPart === 'udder' ? '#3B9EFF' : 'transparent'}
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300"
          style={selectedPart === 'udder' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}}
          onClick={() => onSelectPart('udder')}
        />

        {/* Legs */}
        <rect x="148" y="148" width="12" height="40" rx="5" fill={selectedPart === 'legs' ? '#3B9EFF' : 'transparent'} stroke={selectedPart === 'legs' ? '#3B9EFF' : 'transparent'} strokeWidth="2" className="cursor-pointer transition-all duration-300" style={selectedPart === 'legs' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}} onClick={() => onSelectPart('legs')} />
        <rect x="165" y="148" width="12" height="40" rx="5" fill={selectedPart === 'legs' ? '#3B9EFF' : 'transparent'} stroke={selectedPart === 'legs' ? '#3B9EFF' : 'transparent'} strokeWidth="2" className="cursor-pointer transition-all duration-300" style={selectedPart === 'legs' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}} onClick={() => onSelectPart('legs')} />
        <rect x="182" y="148" width="12" height="40" rx="5" fill={selectedPart === 'legs' ? '#3B9EFF' : 'transparent'} stroke={selectedPart === 'legs' ? '#3B9EFF' : 'transparent'} strokeWidth="2" className="cursor-pointer transition-all duration-300" style={selectedPart === 'legs' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}} onClick={() => onSelectPart('legs')} />
        <rect x="199" y="148" width="12" height="40" rx="5" fill={selectedPart === 'legs' ? '#3B9EFF' : 'transparent'} stroke={selectedPart === 'legs' ? '#3B9EFF' : 'transparent'} strokeWidth="2" className="cursor-pointer transition-all duration-300" style={selectedPart === 'legs' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}} onClick={() => onSelectPart('legs')} />

        {/* Hooves */}
        <ellipse cx="154" cy="192" rx="7" ry="4" fill={selectedPart === 'hooves' ? '#3B9EFF' : 'transparent'} stroke={selectedPart === 'hooves' ? '#3B9EFF' : 'transparent'} strokeWidth="1.5" className="cursor-pointer transition-all duration-300" style={selectedPart === 'hooves' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}} onClick={() => onSelectPart('hooves')} />
        <ellipse cx="171" cy="192" rx="7" ry="4" fill={selectedPart === 'hooves' ? '#3B9EFF' : 'transparent'} stroke={selectedPart === 'hooves' ? '#3B9EFF' : 'transparent'} strokeWidth="1.5" className="cursor-pointer transition-all duration-300" style={selectedPart === 'hooves' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}} onClick={() => onSelectPart('hooves')} />
        <ellipse cx="188" cy="192" rx="7" ry="4" fill={selectedPart === 'hooves' ? '#3B9EFF' : 'transparent'} stroke={selectedPart === 'hooves' ? '#3B9EFF' : 'transparent'} strokeWidth="1.5" className="cursor-pointer transition-all duration-300" style={selectedPart === 'hooves' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}} onClick={() => onSelectPart('hooves')} />
        <ellipse cx="205" cy="192" rx="7" ry="4" fill={selectedPart === 'hooves' ? '#3B9EFF' : 'transparent'} stroke={selectedPart === 'hooves' ? '#3B9EFF' : 'transparent'} strokeWidth="1.5" className="cursor-pointer transition-all duration-300" style={selectedPart === 'hooves' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}} onClick={() => onSelectPart('hooves')} />

        {/* Tail */}
        <path
          d="M133,100 Q110,110 105,135 Q102,150 108,165"
          fill="none"
          stroke={selectedPart === 'tail' ? '#3B9EFF' : '#d6c9b0'}
          strokeWidth="3"
          className="cursor-pointer transition-all duration-300"
          style={selectedPart === 'tail' ? { filter: 'url(#glow)', animation: 'glowPulse 1.5s infinite' } : {}}
          onClick={() => onSelectPart('tail')}
        />
        <circle cx="108" cy="168" r="4" fill={selectedPart === 'tail' ? '#3B9EFF' : '#d6c9b0'} className="cursor-pointer transition-all duration-300" style={selectedPart === 'tail' ? { animation: 'glowPulse 1.5s infinite' } : {}} onClick={() => onSelectPart('tail')} />

        {/* Spots / markings */}
        <circle cx="160" cy="95" r="8" fill="#2D5016" opacity="0.15" />
        <circle cx="195" cy="110" r="6" fill="#2D5016" opacity="0.1" />
        <circle cx="175" cy="125" r="10" fill="#2D5016" opacity="0.12" />
      </svg>

      {/* Part labels overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {BODY_PARTS.map((part) => {
          const positions = {
            head: { top: '4%', right: '8%' },
            eyes: { top: '12%', right: '16%' },
            nose: { top: '16%', right: '6%' },
            neck: { top: '20%', right: '22%' },
            body: { top: '28%', left: '15%' },
            udder: { top: '50%', left: '20%' },
            legs: { top: '54%', left: '5%', right: '5%' },
            tail: { top: '32%', left: '0%' },
            hooves: { top: '68%', left: '8%', right: '8%' },
          }
          const pos = positions[part.id]
          if (!pos) return null
          const isSelected = selectedPart === part.id
          return (
            <button
              key={part.id}
              onClick={() => onSelectPart(part.id)}
              className={`pointer-events-auto absolute rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all duration-300 ${
                isSelected
                  ? 'bg-honey-500 text-white shadow-lg shadow-honey-500/40 scale-110'
                  : 'bg-sand-100/90 text-sand-700 hover:bg-honey-100 hover:text-honey-700 dark:bg-barn-800/80 dark:text-sand-300'
              }`}
              style={pos}
            >
              {part.icon} {part.label}
            </button>
          )
        })}
      </div>

      {/* Scan indicator */}
      {scanActive && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-1.5 rounded-full bg-ai/10 px-3 py-1">
            <div className="h-2 w-2 animate-pulse rounded-full bg-ai" />
            <span className="text-[10px] font-medium text-ai-dark">Scanning...</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Risk Assessment Dashboard component
function RiskAssessmentDashboard({ animal }) {
  const [animScore, setAnimScore] = useState(0)
  const score = animal?.riskScore || 0
  const trend = animal?.trend || 'flat'

  useEffect(() => {
    const timer = setTimeout(() => setAnimScore(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference - (animScore / 100) * circumference
  const riskLevel = score >= 70 ? 'critical' : score >= 45 ? 'high' : score >= 20 ? 'moderate' : 'low'
  const riskColors = {
    low: { stroke: '#16a34a', bg: 'bg-forest-100 text-forest-700 dark:bg-forest-900/40 dark:text-forest-400', label: 'Low Risk' },
    moderate: { stroke: '#f59e0b', bg: 'bg-honey-100 text-honey-700 dark:bg-honey-900/40 dark:text-honey-400', label: 'Moderate Risk' },
    high: { stroke: '#f97316', bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400', label: 'High Risk' },
    critical: { stroke: '#ef4444', bg: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400', label: 'Critical Risk' },
  }
  const riskColor = riskColors[riskLevel]
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-forest-500' : 'text-sand-400'

  // Predicted health trajectory
  const trajectoryPoints = useMemo(() => {
    const base = 100 - score
    const points = []
    for (let i = 0; i <= 8; i++) {
      const variation = (Math.sin(i * 0.8) * 5 + (trend === 'up' ? i * 2 : trend === 'down' ? -i * 2 : 0))
      points.push(Math.max(0, Math.min(100, base + variation + (Math.random() - 0.5) * 8)))
    }
    return points
  }, [score, trend])

  const chartWidth = 280
  const chartHeight = 100
  const chartPadding = 20
  const xStep = (chartWidth - chartPadding * 2) / (trajectoryPoints.length - 1)
  const pathD = trajectoryPoints
    .map((val, i) => {
      const x = chartPadding + i * xStep
      const y = chartPadding + (1 - val / 100) * (chartHeight - chartPadding * 2)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  const areaD = `${pathD} L ${chartPadding + (trajectoryPoints.length - 1) * xStep} ${chartHeight - chartPadding} L ${chartPadding} ${chartHeight - chartPadding} Z`

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        {/* Animated circular gauge */}
        <div className="relative" style={{ width: 180, height: 180 }}>
          <svg viewBox="0 0 180 180" className="w-full h-full">
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r="70"
              fill="none"
              stroke="#e8dfd0"
              strokeWidth="12"
              className="dark:stroke-barn-800"
            />
            {/* Progress circle */}
            <circle
              cx="90"
              cy="90"
              r="70"
              fill="none"
              stroke={riskColor.stroke}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 70}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 90 90)"
              className="transition-all duration-1000 ease-out"
              style={{ filter: `drop-shadow(0 0 8px ${riskColor.stroke}40)` }}
            />
            {/* Center text */}
            <text x="90" y="82" textAnchor="middle" className="text-3xl font-bold fill-sand-900 dark:fill-sand-100">
              {animScore}
            </text>
            <text x="90" y="102" textAnchor="middle" className="text-xs fill-sand-500">
              Health Score
            </text>
          </svg>
          {/* Risk badge */}
          <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[10px] font-bold ${riskColor.bg}`}>
            {riskColor.label}
          </div>
        </div>

        {/* Trend indicator */}
        <div className={`mt-4 flex items-center gap-1.5 ${trendColor}`}>
          <TrendIcon size={16} />
          <span className="text-sm font-medium capitalize">{trend === 'flat' ? 'Stable' : trend === 'up' ? 'Risk Increasing' : 'Risk Decreasing'}</span>
        </div>
      </div>

      {/* Risk factors */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-sand-500">Risk Factors</h4>
        {animal?.scc > 200 && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 dark:bg-red-950/30">
            <AlertTriangle size={14} className="shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-xs font-medium text-red-700 dark:text-red-400">Elevated SCC</p>
              <p className="text-[10px] text-red-500">{animal.scc} k cells/mL (threshold: 200)</p>
            </div>
            <span className="text-[10px] font-semibold text-red-500">HIGH</span>
          </div>
        )}
        {animal?.previousMastitis && (
          <div className="flex items-center gap-2 rounded-lg bg-honey-50 p-2.5 dark:bg-honey-950/30">
            <AlertCircle size={14} className="shrink-0 text-honey-500" />
            <div className="flex-1">
              <p className="text-xs font-medium text-honey-700 dark:text-honey-400">Previous Mastitis</p>
              <p className="text-[10px] text-honey-500">History of infection</p>
            </div>
            <span className="text-[10px] font-semibold text-honey-500">MED</span>
          </div>
        )}
        {(animal?.temperature || 0) > 39 && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 dark:bg-red-950/30">
            <Thermometer size={14} className="shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-xs font-medium text-red-700 dark:text-red-400">Elevated Temperature</p>
              <p className="text-[10px] text-red-500">{animal.temperature}°C (normal: 38.5°C)</p>
            </div>
            <span className="text-[10px] font-semibold text-red-500">HIGH</span>
          </div>
        )}
        {(animal?.activity || 0) < -10 && (
          <div className="flex items-center gap-2 rounded-lg bg-honey-50 p-2.5 dark:bg-honey-950/30">
            <Activity size={14} className="shrink-0 text-honey-500" />
            <div className="flex-1">
              <p className="text-xs font-medium text-honey-700 dark:text-honey-400">Reduced Activity</p>
              <p className="text-[10px] text-honey-500">{animal.activity}% change</p>
            </div>
            <span className="text-[10px] font-semibold text-honey-500">MED</span>
          </div>
        )}
      </div>

      {/* Predicted health trajectory chart */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-sand-500">Health Trajectory (8 weeks)</h4>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((v) => (
            <line
              key={v}
              x1={chartPadding}
              y1={chartPadding + (1 - v / 100) * (chartHeight - chartPadding * 2)}
              x2={chartWidth - chartPadding}
              y2={chartPadding + (1 - v / 100) * (chartHeight - chartPadding * 2)}
              stroke="#e8dfd0"
              strokeWidth="0.5"
              className="dark:stroke-barn-800"
            />
          ))}
          {/* Threshold line at 70 (red line) */}
          <line
            x1={chartPadding}
            y1={chartPadding + 0.3 * (chartHeight - chartPadding * 2)}
            x2={chartWidth - chartPadding}
            y2={chartPadding + 0.3 * (chartHeight - chartPadding * 2)}
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.5"
          />
          <text x={chartWidth - chartPadding + 2} y={chartPadding + 0.3 * (chartHeight - chartPadding * 2) + 3} className="text-[8px] fill-red-500">
            WARN
          </text>

          {/* Area fill */}
          <path d={areaD} fill="url(#chartGrad)" opacity="0.3" />
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={riskColor.stroke} stopOpacity="0.4" />
              <stop offset="100%" stopColor={riskColor.stroke} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Line */}
          <path d={pathD} fill="none" stroke={riskColor.stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {trajectoryPoints.map((val, i) => {
            const x = chartPadding + i * xStep
            const y = chartPadding + (1 - val / 100) * (chartHeight - chartPadding * 2)
            return (
              <circle key={i} cx={x} cy={y} r="3" fill={riskColor.stroke} stroke="white" strokeWidth="1.5" />
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// SCC Trend component
function SCCTrendChart() {
  const maxVal = 300
  const chartWidth = 400
  const chartHeight = 140
  const padding = { top: 20, right: 10, bottom: 30, left: 35 }
  const innerW = chartWidth - padding.left - padding.right
  const innerH = chartHeight - padding.top - padding.bottom

  const xStep = innerW / (SCC_DATA.length - 1)
  const pathD = SCC_DATA
    .map((d, i) => {
      const x = padding.left + i * xStep
      const y = padding.top + (1 - Math.min(d.value, maxVal) / maxVal) * innerH
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  const areaD = `${pathD} L ${padding.left + (SCC_DATA.length - 1) * xStep} ${padding.top + innerH} L ${padding.left} ${padding.top + innerH} Z`

  const thresholdY = padding.top + (1 - 200 / maxVal) * innerH

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
      <defs>
        <linearGradient id="sccGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D97706" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y-axis labels */}
      {[0, 100, 200, 300].map((v) => {
        const y = padding.top + (1 - v / maxVal) * innerH
        return (
          <g key={v}>
            <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#e8dfd0" strokeWidth="0.5" className="dark:stroke-barn-800" />
            <text x={padding.left - 5} y={y + 3} textAnchor="end" className="text-[9px] fill-sand-400">
              {v}
            </text>
          </g>
        )
      })}

      {/* Threshold line */}
      <line
        x1={padding.left}
        y1={thresholdY}
        x2={chartWidth - padding.right}
        y2={thresholdY}
        stroke="#ef4444"
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />
      <text x={chartWidth - padding.right} y={thresholdY - 5} textAnchor="end" className="text-[9px] font-bold fill-red-500">
        THRESHOLD (200)
      </text>

      {/* Warning zone fill */}
      <rect
        x={padding.left}
        y={padding.top}
        width={innerW}
        height={thresholdY - padding.top}
        fill="#ef4444"
        opacity="0.05"
        className="dark:fill-red-500/10"
      />

      {/* Area */}
      <path d={areaD} fill="url(#sccGrad)" />

      {/* Line */}
      <path d={pathD} fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {SCC_DATA.map((d, i) => {
        const x = padding.left + i * xStep
        const y = padding.top + (1 - Math.min(d.value, maxVal) / maxVal) * innerH
        const isAboveThreshold = d.value > 200
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill={isAboveThreshold ? '#ef4444' : '#D97706'} stroke="white" strokeWidth="1.5" />
            <text x={x} y={padding.top + innerH + 16} textAnchor="middle" className="text-[9px] fill-sand-500">
              {d.week}
            </text>
            <text x={x} y={y - 8} textAnchor="middle" className="text-[8px] font-medium fill-sand-600 dark:fill-sand-400">
              {d.value}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function DetectionEnhanced() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('scanner')
  const [scannerTab, setScannerTab] = useState('xray')
  const [selectedPart, setSelectedPart] = useState(null)
  const [scanActive, setScanActive] = useState(true)
  const [symptomInput, setSymptomInput] = useState('')
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hello! I\'m the Gaurogya Setu AI health assistant. Describe your animal\'s symptoms and I\'ll help you identify potential conditions. For example: "cow has reduced milk output and swollen udder"' },
  ])
  const [selectedAnimal, setSelectedAnimal] = useState(CURATED[0])
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  // Auto-scan animation
  useEffect(() => {
    if (activeTab !== 'scanner') return
    const interval = setInterval(() => {
      setScanActive(true)
      setTimeout(() => setScanActive(false), 2500)
    }, 4000)
    return () => clearInterval(interval)
  }, [activeTab])

  const handleSymptomSubmit = useCallback(() => {
    if (!symptomInput.trim()) return

    const userMsg = { role: 'user', text: symptomInput }
    setChatHistory((prev) => [...prev, userMsg])
    setSymptomInput('')
    setIsTyping(true)

    // Keyword matching to find best response
    const inputLower = symptomInput.toLowerCase()
    let bestMatch = null
    let bestScore = 0

    for (const response of SYMPTOM_RESPONSES) {
      let matchCount = 0
      for (const keyword of response.keywords) {
        if (inputLower.includes(keyword.toLowerCase())) {
          matchCount++
        }
      }
      if (matchCount > bestScore) {
        bestScore = matchCount
        bestMatch = response
      }
    }

    // Simulate AI thinking delay
    setTimeout(() => {
      const response = bestMatch || DEFAULT_RESPONSE
      const aiMsg = {
        role: 'ai',
        data: response,
      }
      setChatHistory((prev) => [...prev, aiMsg])
      setIsTyping(false)
      playAlertSound('moderate')
    }, 1200 + Math.random() * 800)
  }, [symptomInput])

  const handlePartSelect = (partId) => {
    setSelectedPart(partId)
    if (partId) {
      setScanActive(true)
      setTimeout(() => setScanActive(false), 2500)
      playAlertSound('moderate')
    }
  }

  const selectedConditions = selectedPart ? DISEASE_CONDITIONS[selectedPart] || [] : []

  const tabs = [
    { id: 'scanner', label: 'Disease Scanner', icon: Scan },
    { id: 'symptoms', label: 'AI Symptom Analyzer', icon: Brain },
    { id: 'dashboard', label: 'Risk Dashboard', icon: Activity },
    { id: 'scc', label: 'SCC Trends', icon: TrendingUp },
  ]

  return (
    <div>
      {/* Page Header */}
      <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-ai to-forest-500 shadow-lg shadow-ai/20">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sand-900 dark:text-sand-100 sm:text-2xl">AI Disease Detection</h1>
              <p className="text-xs text-sand-500 dark:text-sand-400 sm:text-sm">Advanced diagnostic tools powered by artificial intelligence</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-ai-light px-3 py-1.5 dark:bg-ai-dark/20">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-ai" />
            <span className="text-[11px] font-semibold text-ai-dark dark:text-ai">AI Model Active</span>
          </div>
          <select
            value={selectedAnimal?.id}
            onChange={(e) => {
              const found = CURATED.find((a) => a.id === e.target.value)
              if (found) setSelectedAnimal(found)
            }}
            className="rounded-lg border border-sand-200 bg-white px-2.5 py-1.5 text-xs dark:border-barn-800 dark:bg-barn-950 dark:text-sand-100"
          >
            {CURATED.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} ({a.breed})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Row */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5">
        <Card className="p-3 text-center sm:p-4">
          <div className="text-lg font-bold text-ai sm:text-xl">98.7%</div>
          <p className="text-[10px] text-sand-500 sm:text-xs">AI Accuracy</p>
        </Card>
        <Card className="p-3 text-center sm:p-4">
          <div className="text-lg font-bold text-forest-600 sm:text-xl">1.2s</div>
          <p className="text-[10px] text-sand-500 sm:text-xs">Scan Time</p>
        </Card>
        <Card className="p-3 text-center sm:p-4">
          <div className="text-lg font-bold text-honey-600 sm:text-xl">12</div>
          <p className="text-[10px] text-sand-500 sm:text-xs">Conditions Detected</p>
        </Card>
        <Card className="p-3 text-center sm:p-4">
          <div className="text-lg font-bold text-sand-900 dark:text-sand-100 sm:text-xl">{selectedAnimal?.riskScore}%</div>
          <p className="text-[10px] text-sand-500 sm:text-xs">Risk Score</p>
        </Card>
        <Card className="p-3 text-center sm:p-4">
          <div className="text-lg font-bold text-sand-900 dark:text-sand-100 sm:text-xl">
            {detectAnomalies(selectedAnimal).anomalies.length}
          </div>
          <p className="text-[10px] text-sand-500 sm:text-xs">Active Alerts</p>
        </Card>
      </div>

      {/* Main Tabs */}
      <div className="mb-5 flex flex-wrap gap-1.5 rounded-xl bg-sand-100 p-1 dark:bg-barn-800/40">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
                activeTab === tab.id
                  ? 'bg-white text-sand-900 shadow-sm dark:bg-barn-900 dark:text-sand-100'
                  : 'text-sand-500 hover:text-sand-700 dark:text-sand-400 dark:hover:text-sand-200'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'scanner' && (
        <div className="space-y-5">
          {/* Scanner sub-tabs */}
          <div className="flex gap-1 rounded-lg bg-sand-100 p-0.5 dark:bg-barn-800/40">
            {[
              { id: 'xray', label: 'X-Ray Vision', icon: XRay },
              { id: 'ultrasound', label: 'Ultrasound Scan', icon: Waves },
              { id: 'skin', label: 'Skin Analysis', icon: Eye },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setScannerTab(tab.id)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
                    scannerTab === tab.id
                      ? 'bg-white text-sand-900 shadow-sm dark:bg-barn-900 dark:text-sand-100'
                      : 'text-sand-500 dark:text-sand-400'
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            {/* Left: Cow body diagram */}
            <div className="lg:col-span-3">
              <Card className="p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <SectionTitle>
                    <span className="flex items-center gap-1.5">
                      <Crosshair size={14} className="text-ai" />
                      {scannerTab === 'xray' ? 'X-Ray Scanner' : scannerTab === 'ultrasound' ? 'Ultrasound Scanner' : 'Skin Analysis Scanner'}
                    </span>
                  </SectionTitle>
                  <button
                    onClick={() => {
                      setScanActive(true)
                      setTimeout(() => setScanActive(false), 2500)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-ai/10 px-3 py-1.5 text-xs font-medium text-ai-dark transition-colors hover:bg-ai/20 dark:text-ai"
                  >
                    <Sparkles size={12} />
                    Scan
                  </button>
                </div>

                {scannerTab === 'xray' && (
                  <div>
                    <CowBodyDiagram selectedPart={selectedPart} onSelectPart={handlePartSelect} scanActive={scanActive} />

                    {/* Body part quick-select buttons */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {BODY_PARTS.map((part) => (
                        <button
                          key={part.id}
                          onClick={() => handlePartSelect(part.id)}
                          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                            selectedPart === part.id
                              ? 'bg-honey-500 text-white shadow-md shadow-honey-500/30'
                              : 'bg-sand-100 text-sand-600 hover:bg-honey-50 hover:text-honey-700 dark:bg-barn-800/60 dark:text-sand-300'
                          }`}
                        >
                          {part.icon} {part.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {scannerTab === 'ultrasound' && (
                  <div className="flex flex-col items-center">
                    {/* Animated ultrasound circle scan */}
                    <div className="relative">
                      <div className="grid h-64 w-64 place-items-center">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                          <defs>
                            <radialGradient id="ultraGrad">
                              <stop offset="0%" stopColor="#3B9EFF" stopOpacity="0.1" />
                              <stop offset="70%" stopColor="#3B9EFF" stopOpacity="0.05" />
                              <stop offset="100%" stopColor="#3B9EFF" stopOpacity="0" />
                            </radialGradient>
                          </defs>
                          {/* Background circles */}
                          <circle cx="100" cy="100" r="90" fill="url(#ultraGrad)" />
                          {[80, 60, 40, 20].map((r) => (
                            <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#3B9EFF" strokeWidth="0.5" opacity="0.2" />
                          ))}
                          {/* Sweep line */}
                          <line
                            x1="100"
                            y1="100"
                            x2="100"
                            y2="10"
                            stroke="#3B9EFF"
                            strokeWidth="2"
                            strokeLinecap="round"
                            opacity="0.8"
                            style={{ animation: 'ultrasoundSweep 3s linear infinite', transformOrigin: '100px 100px' }}
                          />
                          {/* Center dot */}
                          <circle cx="100" cy="100" r="3" fill="#3B9EFF" />
                          {/* Abnormality markers */}
                          <circle cx="130" cy="70" r="5" fill="#ef4444" opacity="0.8">
                            <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite" />
                          </circle>
                          <circle cx="70" cy="130" r="4" fill="#f97316" opacity="0.7">
                            <animate attributeName="r" values="3;6;3" dur="1.8s" repeatCount="indefinite" />
                          </circle>
                          <circle cx="120" cy="120" r="3" fill="#f59e0b" opacity="0.6">
                            <animate attributeName="r" values="2;5;2" dur="2.2s" repeatCount="indefinite" />
                          </circle>
                        </svg>
                      </div>
                      <style>{`
                        @keyframes ultrasoundSweep {
                          from { transform: rotate(0deg); }
                          to { transform: rotate(360deg); }
                        }
                      `}</style>
                    </div>
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-semibold text-sand-700 dark:text-sand-300">Detected Abnormalities</h4>
                      {[
                        { area: 'Udder Region', finding: 'Hypoechoic lesion (4.2 cm)', severity: 'high', confidence: 89 },
                        { area: 'Liver', finding: 'Mild hepatomegaly', severity: 'medium', confidence: 72 },
                        { area: 'Rumen', finding: 'Gas accumulation pattern', severity: 'low', confidence: 45 },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border border-sand-200 bg-white p-3 dark:border-barn-800/40 dark:bg-barn-950/40">
                          <div className={`h-2 w-2 rounded-full ${item.severity === 'high' ? 'bg-red-500' : item.severity === 'medium' ? 'bg-honey-500' : 'bg-forest-400'}`} />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-sand-900 dark:text-sand-100">{item.area}</p>
                            <p className="text-[11px] text-sand-500">{item.finding}</p>
                          </div>
                          <span className="text-[11px] font-bold text-ai">{item.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scannerTab === 'skin' && (
                  <div>
                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3">
                      {BODY_PARTS.map((part) => {
                        const healthStatus = part.id === 'udder' ? 'warning' : part.id === 'hooves' ? 'critical' : part.id === 'legs' ? 'warning' : 'healthy'
                        const statusConfig = {
                          healthy: { bg: 'bg-forest-100 border-forest-200 dark:bg-forest-950/30 dark:border-forest-800/40', dot: 'bg-forest-500', text: 'text-forest-700 dark:text-forest-400', label: 'Healthy' },
                          warning: { bg: 'bg-honey-100 border-honey-200 dark:bg-honey-950/30 dark:border-honey-800/40', dot: 'bg-honey-500', text: 'text-honey-700 dark:text-honey-400', label: 'Monitor' },
                          critical: { bg: 'bg-red-100 border-red-200 dark:bg-red-950/30 dark:border-red-800/40', dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400', label: 'Attention' },
                        }
                        const config = statusConfig[healthStatus]
                        return (
                          <div key={part.id} className={`rounded-xl border p-3 transition-all hover:shadow-md ${config.bg}`}>
                            <div className="text-center">
                              <div className="text-2xl mb-1">{part.icon}</div>
                              <p className="text-[11px] font-semibold text-sand-900 dark:text-sand-100">{part.label}</p>
                              <div className="mt-1.5 flex items-center justify-center gap-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                                <span className={`text-[10px] font-medium ${config.text}`}>{config.label}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Detection results panel */}
            <div className="lg:col-span-2">
              <Card className="p-4 sm:p-5">
                <SectionTitle>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-forest-500" />
                    Detection Results
                  </span>
                </SectionTitle>

                {!selectedPart ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-sand-100 dark:bg-barn-800/40">
                      <Crosshair size={24} className="text-sand-400" />
                    </div>
                    <p className="text-sm font-medium text-sand-500">Select a body part</p>
                    <p className="text-[11px] text-sand-400 mt-1">Click on the cow diagram or use the buttons below to scan a specific region</p>
                  </div>
                ) : (
                  <div className="space-y-3" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
                    <div className="flex items-center gap-2 rounded-lg bg-ai-light p-2.5 dark:bg-ai-dark/10">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-ai" />
                      <span className="text-xs font-medium text-ai-dark dark:text-ai">
                        {selectedPart.charAt(0).toUpperCase() + selectedPart.slice(1)} analysis complete
                      </span>
                    </div>

                    {selectedConditions.map((condition, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-sand-200 bg-white p-3.5 dark:border-barn-800/40 dark:bg-barn-950/40"
                        style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.1}s both` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-sand-900 dark:text-sand-100">{condition.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            condition.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            condition.severity === 'medium' ? 'bg-honey-100 text-honey-700 dark:bg-honey-900/30 dark:text-honey-400' :
                            'bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-400'
                          }`}>
                            {condition.severity === 'high' ? 'HIGH' : condition.severity === 'medium' ? 'MED' : 'LOW'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-sand-100 dark:bg-barn-800">
                              <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{
                                  width: `${condition.confidence}%`,
                                  background: condition.confidence > 80 ? 'linear-gradient(90deg, #ef4444, #f97316)' :
                                    condition.confidence > 60 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                                    'linear-gradient(90deg, #16a34a, #4ade80)',
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-bold text-sand-700 dark:text-sand-300">{condition.confidence}%</span>
                        </div>
                      </div>
                    ))}

                    {/* Recommendation */}
                    <div className="rounded-lg border border-ai/20 bg-ai-light/50 p-3 dark:bg-ai-dark/5">
                      <div className="flex items-start gap-2">
                        <Info size={14} className="mt-0.5 shrink-0 text-ai" />
                        <p className="text-[11px] leading-relaxed text-ai-dark dark:text-ai">
                          {selectedConditions[0]?.confidence > 85
                            ? `High confidence detection. Immediate veterinary consultation recommended for ${selectedConditions[0]?.name}.`
                            : 'Moderate confidence detection. Monitor closely and consult a veterinarian if symptoms persist or worsen.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Active alerts from selected animal */}
              <Card className="mt-4 p-4 sm:p-5">
                <SectionTitle>
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-honey-500" />
                    Active Alerts
                  </span>
                </SectionTitle>
                <div className="space-y-2.5">
                  {detectAnomalies(selectedAnimal).anomalies.length === 0 ? (
                    <p className="text-xs text-sand-400">No active anomalies detected</p>
                  ) : (
                    detectAnomalies(selectedAnimal).anomalies.map((anomaly, i) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-lg border border-sand-200 bg-white p-2.5 dark:border-barn-800/40 dark:bg-barn-950/40">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          anomaly.severity === 'critical' ? 'bg-red-500' : anomaly.severity === 'warning' ? 'bg-honey-500' : 'bg-ai'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-sand-900 dark:text-sand-100 capitalize">{anomaly.type}</p>
                          <p className="text-[10px] text-sand-400">
                            {anomaly.value} {anomaly.unit} vs threshold {anomaly.threshold} {anomaly.unit}
                          </p>
                        </div>
                        <span className={`shrink-0 text-[9px] font-semibold uppercase ${
                          anomaly.severity === 'critical' ? 'text-red-500' : anomaly.severity === 'warning' ? 'text-honey-500' : 'text-ai'
                        }`}>
                          {anomaly.severity}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'symptoms' && (
        <Card className="flex flex-col" style={{ maxHeight: '600px' }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-sand-200 p-4 dark:border-barn-800/40">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-ai to-forest-500">
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-sand-900 dark:text-sand-100">AI Health Assistant</h3>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest-500" />
                <span className="text-[10px] text-forest-600 dark:text-forest-400">Online - Ready to diagnose</span>
              </div>
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: '400px' }}>
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-honey-500 px-4 py-2.5 text-sm text-white">
                    {msg.text}
                  </div>
                ) : msg.data ? (
                  <div className="max-w-[90%] space-y-3">
                    {/* AI Insight */}
                    <div className="flex gap-2.5">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ai to-forest-500">
                        <Brain size={14} className="text-white" />
                      </div>
                      <div className="space-y-3 flex-1">
                        <div className="rounded-2xl rounded-tl-sm border border-sand-200 bg-white p-3.5 dark:border-barn-800/40 dark:bg-barn-950/40">
                          <p className="text-xs leading-relaxed text-sand-700 dark:text-sand-300">{msg.data.insight}</p>
                        </div>

                        {/* Conditions */}
                        <div className="rounded-2xl rounded-tl-sm border border-sand-200 bg-white p-3.5 dark:border-barn-800/40 dark:bg-barn-950/40">
                          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-sand-700 dark:text-sand-300">
                            <Activity size={12} className="text-ai" />
                            Possible Conditions
                          </h4>
                          <div className="space-y-2">
                            {msg.data.conditions.map((cond, j) => (
                              <div key={j}>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-sand-900 dark:text-sand-100">{cond.name}</span>
                                  <span className={`text-[10px] font-bold ${
                                    cond.severity === 'critical' ? 'text-red-500' :
                                    cond.severity === 'high' ? 'text-orange-500' :
                                    cond.severity === 'moderate' ? 'text-honey-500' : 'text-forest-500'
                                  }`}>{cond.confidence}%</span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-sand-100 dark:bg-barn-800">
                                  <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                      width: `${cond.confidence}%`,
                                      background: cond.confidence > 80 ? '#ef4444' : cond.confidence > 60 ? '#f59e0b' : '#16a34a',
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recommended Actions */}
                        <div className="rounded-2xl rounded-tl-sm border border-sand-200 bg-white p-3.5 dark:border-barn-800/40 dark:bg-barn-950/40">
                          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-sand-700 dark:text-sand-300">
                            <Shield size={12} className="text-forest-500" />
                            Recommended Actions
                          </h4>
                          <ul className="space-y-1.5">
                            {msg.data.actions.map((action, j) => (
                              <li key={j} className="flex items-start gap-2">
                                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-forest-500" />
                                <span className="text-xs text-sand-600 dark:text-sand-400">{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Medicine suggestions */}
                        {msg.data.medicines.length > 0 && (
                          <div className="rounded-2xl rounded-tl-sm border border-ai/20 bg-ai-light/50 p-3.5 dark:bg-ai-dark/5">
                            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ai-dark dark:text-ai">
                              <Stethoscope size={12} />
                              Medicine Suggestions
                            </h4>
                            <div className="space-y-2">
                              {msg.data.medicines.map((med, j) => (
                                <div key={j} className="rounded-lg border border-ai/10 bg-white/80 p-2 dark:bg-barn-950/40">
                                  <p className="text-xs font-semibold text-sand-900 dark:text-sand-100">{med.name}</p>
                                  <p className="text-[10px] text-sand-500">Dose: {med.dose}</p>
                                  <p className="text-[10px] text-sand-400">Duration: {med.duration}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Vet referral warning */}
                        {msg.data.vetReferral && (
                          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800/40 dark:bg-red-950/20">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-500" />
                            <div>
                              <p className="text-xs font-semibold text-red-700 dark:text-red-400">Veterinarian Referral Recommended</p>
                              <p className="text-[11px] text-red-600 dark:text-red-500">Based on severity assessment, professional veterinary consultation is strongly advised.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2.5">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ai to-forest-500">
                      <Brain size={14} className="text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-sand-200 bg-white p-3.5 dark:border-barn-800/40 dark:bg-barn-950/40">
                      <p className="text-xs leading-relaxed text-sand-700 dark:text-sand-300">{msg.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-sand-200 bg-white px-4 py-3 dark:border-barn-800/40 dark:bg-barn-950/40">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ai [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ai [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ai" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="border-t border-sand-200 p-3 dark:border-barn-800/40">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSymptomSubmit()}
                placeholder="Describe symptoms... e.g. 'cow has fever and reduced appetite'"
                className="flex-1 rounded-xl border border-sand-200 bg-sand-50 px-4 py-2.5 text-xs outline-none transition-colors focus:border-ai focus:ring-1 focus:ring-ai dark:border-barn-800 dark:bg-barn-900 dark:text-sand-100 dark:placeholder:text-sand-500"
              />
              <button
                onClick={handleSymptomSubmit}
                disabled={!symptomInput.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ai text-white transition-colors hover:bg-ai-dark disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['Reduced milk output', 'Fever', 'Lameness', 'Eye discharge', 'Coughing', 'Not eating'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setSymptomInput(suggestion)}
                  className="rounded-lg bg-sand-100 px-2 py-1 text-[10px] text-sand-600 transition-colors hover:bg-honey-100 hover:text-honey-700 dark:bg-barn-800/40 dark:text-sand-400 dark:hover:bg-honey-950/30"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'dashboard' && (
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Risk Gauge & Health Score */}
          <Card className="p-5">
            <SectionTitle>
              <span className="flex items-center gap-1.5">
                <Heart size={14} className="text-red-500" />
                Health Score
              </span>
            </SectionTitle>
            <RiskAssessmentDashboard animal={selectedAnimal} />
          </Card>

          {/* Breed comparison & details */}
          <Card className="p-5 lg:col-span-2">
            <SectionTitle>
              <span className="flex items-center gap-1.5">
                <BarChart3 size={14} className="text-honey-500" />
                Breed Health Comparison
              </span>
            </SectionTitle>

            <div className="space-y-4">
              {/* Breed averages */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { breed: 'Murrah', avgScore: 72, color: 'bg-honey-500' },
                  { breed: 'Gir', avgScore: 85, color: 'bg-forest-500' },
                  { breed: 'Sahiwal', avgScore: 78, color: 'bg-ai' },
                ].map((breed) => (
                  <div key={breed.breed} className="rounded-xl border border-sand-200 bg-white p-3 text-center dark:border-barn-800/40 dark:bg-barn-950/40">
                    <p className="text-xs font-medium text-sand-600 dark:text-sand-400">{breed.breed}</p>
                    <p className={`mt-1 text-lg font-bold ${breed.color.replace('bg-', 'text-')}`}>{breed.avgScore}</p>
                    <p className="text-[10px] text-sand-400">avg score</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-100 dark:bg-barn-800">
                      <div className={`h-full rounded-full ${breed.color}`} style={{ width: `${breed.avgScore}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected animal details */}
              <div className="rounded-xl border border-sand-200 bg-white p-4 dark:border-barn-800/40 dark:bg-barn-950/40">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-sand-900 dark:text-sand-100">{selectedAnimal?.id} - {selectedAnimal?.breed}</h4>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    selectedAnimal?.riskScore >= 70 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    selectedAnimal?.riskScore >= 45 ? 'bg-honey-100 text-honey-700 dark:bg-honey-900/30 dark:text-honey-400' :
                    'bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-400'
                  }`}>
                    Score: {selectedAnimal?.riskScore}/100
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Age', value: `${selectedAnimal?.age} years` },
                    { label: 'Lactation', value: `#${selectedAnimal?.lactation}` },
                    { label: 'Milk Yield', value: `${selectedAnimal?.milkYield} L/day` },
                    { label: 'SCC', value: `${selectedAnimal?.scc} k cells/mL`, highlight: selectedAnimal?.scc > 200 },
                    { label: 'Temperature', value: `${selectedAnimal?.temperature}°C`, highlight: selectedAnimal?.temperature > 39 },
                    { label: 'Activity', value: `${selectedAnimal?.activity}%`, highlight: selectedAnimal?.activity < -10 },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-lg p-2.5 ${item.highlight ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40' : 'bg-sand-50 dark:bg-barn-900/30'}`}>
                      <p className="text-[10px] text-sand-500">{item.label}</p>
                      <p className={`text-sm font-semibold ${item.highlight ? 'text-red-600 dark:text-red-400' : 'text-sand-900 dark:text-sand-100'}`}>
                        {item.value}
                        {item.highlight && <AlertTriangle size={12} className="ml-1 inline text-red-500" />}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk meter comparison */}
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sand-500">vs. Herd Average</h4>
                <div className="space-y-2.5">
                  {[
                    { label: 'This Animal', value: selectedAnimal?.riskScore || 0, color: 'bg-honey-500' },
                    { label: 'Shed Average', value: 45, color: 'bg-sand-400' },
                    { label: 'Herd Average', value: 35, color: 'bg-forest-500' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-sand-600 dark:text-sand-400">{item.label}</span>
                        <span className="text-[11px] font-bold text-sand-900 dark:text-sand-100">{item.value}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-sand-100 dark:bg-barn-800">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${item.color}`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'scc' && (
        <div className="grid gap-5 lg:grid-cols-3">
          {/* SCC Trend Chart */}
          <Card className="p-5 lg:col-span-2">
            <SectionTitle>
              <span className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-honey-500" />
                SCC Trend - {selectedAnimal?.id}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-[10px] text-sand-400">Above threshold</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-honey-500" />
                  <span className="text-[10px] text-sand-400">Below threshold</span>
                </div>
              </div>
            </SectionTitle>

            <SCCTrendChart />

            {/* SCC Stats */}
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[
                { label: 'Current', value: `${SCC_DATA[SCC_DATA.length - 1].value} k`, trend: 'up', highlight: SCC_DATA[SCC_DATA.length - 1].value > 200 },
                { label: 'Average', value: `${Math.round(SCC_DATA.reduce((s, d) => s + d.value, 0) / SCC_DATA.length)} k`, trend: 'flat' },
                { label: 'Peak', value: `${Math.max(...SCC_DATA.map(d => d.value))} k`, trend: 'up' },
                { label: 'Days Above Threshold', value: '12', trend: 'up' },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-lg p-2.5 text-center ${stat.highlight ? 'bg-red-50 dark:bg-red-950/20' : 'bg-sand-50 dark:bg-barn-900/30'}`}>
                  <p className="text-[10px] text-sand-500">{stat.label}</p>
                  <p className={`text-sm font-bold ${stat.highlight ? 'text-red-600 dark:text-red-400' : 'text-sand-900 dark:text-sand-100'}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* SCC Health recommendations */}
          <div className="space-y-4">
            <Card className="p-5">
              <SectionTitle>
                <span className="flex items-center gap-1.5">
                  <Stethoscope size={14} className="text-forest-500" />
                  Recommendations
                </span>
              </SectionTitle>
              <div className="space-y-2.5">
                {[
                  { text: 'Increase milking frequency during high SCC periods', priority: 'high' },
                  { text: 'Implement post-milking teat disinfection', priority: 'high' },
                  { text: 'Consider dry cow therapy for affected quarters', priority: 'medium' },
                  { text: 'Monitor bulk tank SCC daily', priority: 'medium' },
                  { text: 'Review milking equipment maintenance', priority: 'low' },
                ].map((rec, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg border border-sand-200 bg-white p-2.5 dark:border-barn-800/40 dark:bg-barn-950/40">
                    <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                      rec.priority === 'high' ? 'bg-red-500' : rec.priority === 'medium' ? 'bg-honey-500' : 'bg-forest-400'
                    }`} />
                    <span className="text-xs text-sand-700 dark:text-sand-300">{rec.text}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <SectionTitle>
                <span className="flex items-center gap-1.5">
                  <Shield size={14} className="text-honey-500" />
                  SCC Thresholds
                </span>
              </SectionTitle>
              <div className="space-y-3">
                {[
                  { range: '0 - 200', status: 'Normal', color: 'bg-forest-500', description: 'Healthy milk quality' },
                  { range: '200 - 400', status: 'Elevated', color: 'bg-honey-500', description: 'Subclinical mastitis risk' },
                  { range: '400 - 1,000', status: 'High', color: 'bg-orange-500', description: 'Clinical mastitis likely' },
                  { range: '1,000+', status: 'Critical', color: 'bg-red-500', description: 'Immediate treatment required' },
                ].map((threshold) => (
                  <div key={threshold.range} className="flex items-center gap-3">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${threshold.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-sand-900 dark:text-sand-100">{threshold.status}</span>
                        <span className="text-[10px] text-sand-500">{threshold.range} k</span>
                      </div>
                      <p className="text-[10px] text-sand-400">{threshold.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
