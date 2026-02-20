import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================================
// Data Models
// ============================================================

export interface Project {
  id: string;
  title: string;
  createdAt: string; // ISO string
  candidates: string[];
  criteria: string[];
  rankings: Record<string, string[]>; // criterionName -> ordered candidate names (1st to last)
  scores: Record<string, number>; // candidateName -> 100-point score
  winner: string;
}

export interface AppSettings {
  isPremium: boolean;
  colorScheme: "system" | "light" | "dark";
}

// ============================================================
// Free-tier limits
// ============================================================

export const FREE_LIMITS = {
  candidates: 3,
  criteria: 5,
  projects: 3,
} as const;

export const PREMIUM_LIMITS = {
  candidates: 10,
  criteria: Infinity,
  projects: Infinity,
} as const;

// ============================================================
// Templates
// ============================================================

export interface Template {
  id: string;
  name: string;
  icon: string;
  criteria: string[];
}

export const TEMPLATES: Template[] = [
  {
    id: "restaurant",
    name: "飲食店",
    icon: "🍽️",
    criteria: ["価格", "味", "雰囲気", "アクセス", "接客"],
  },
  {
    id: "job",
    name: "就職先",
    icon: "💼",
    criteria: ["給与", "やりがい", "勤務地", "福利厚生", "成長性"],
  },
  {
    id: "housing",
    name: "住居",
    icon: "🏠",
    criteria: ["家賃", "広さ", "駅からの距離", "築年数", "周辺環境"],
  },
  {
    id: "travel",
    name: "旅行先",
    icon: "✈️",
    criteria: ["費用", "観光スポット", "食事", "アクセス", "安全性"],
  },
  {
    id: "product",
    name: "商品比較",
    icon: "🛍️",
    criteria: ["価格", "品質", "デザイン", "レビュー", "ブランド"],
  },
];

// ============================================================
// Score Calculation
// ============================================================

export function calculateScores(
  candidates: string[],
  criteria: string[],
  rankings: Record<string, string[]>
): Record<string, number> {
  const n = candidates.length;
  const rawScores: Record<string, number> = {};

  // Initialize
  for (const c of candidates) {
    rawScores[c] = 0;
  }

  console.log("[CALC] Starting calculation:");
  console.log("[CALC] Candidates:", candidates);
  console.log("[CALC] Criteria:", criteria);
  console.log("[CALC] Rankings:", rankings);

  // Sum rank points for each criterion
  for (const criterion of criteria) {
    const ordered = rankings[criterion];
    console.log(`[CALC] Processing criterion "${criterion}":`, ordered);
    if (!ordered) continue;
    for (let i = 0; i < ordered.length; i++) {
      const candidate = ordered[i];
      const rankPoint = n - i; // 1st gets n points, last gets 1
      rawScores[candidate] = (rawScores[candidate] || 0) + rankPoint;
      console.log(
        `[CALC]   ${candidate}: +${rankPoint} (total: ${rawScores[candidate]})`
      );
    }
  }

  // Convert to 100-point scale
  const maxRaw = criteria.length * n;
  const scores: Record<string, number> = {};
  for (const c of candidates) {
    scores[c] = maxRaw > 0 ? Math.round((rawScores[c] / maxRaw) * 100) : 0;
  }

  console.log("[CALC] Final scores:", scores);
  return scores;
}

export function getConfidenceMessage(diff: number): string {
  if (diff >= 15) return "圧倒的で迷わず選べます";
  if (diff >= 10) return "明確な差があります";
  if (diff >= 5) return "やや優勢です";
  return "僅差でした";
}

export function getScoreColor(score: number): string {
  if (score >= 90) return "#F59E0B"; // gold
  if (score >= 75) return "#22C55E"; // green
  if (score >= 60) return "#6366F1"; // blue/indigo
  return "#8E8EA0"; // gray
}

// ============================================================
// Storage Keys
// ============================================================

const PROJECTS_KEY = "@decision_score_projects";
const SETTINGS_KEY = "@decision_score_settings";

// ============================================================
// Project CRUD
// ============================================================

export async function loadProjects(): Promise<Project[]> {
  try {
    const raw = await AsyncStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

export async function saveProject(project: Project): Promise<void> {
  const projects = await loadProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.unshift(project);
  }
  await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export async function deleteProject(id: string): Promise<void> {
  const projects = await loadProjects();
  const filtered = projects.filter((p) => p.id !== id);
  await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
}

// ============================================================
// Settings
// ============================================================

const DEFAULT_SETTINGS: AppSettings = {
  isPremium: false,
  colorScheme: "system",
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ============================================================
// UUID generator
// ============================================================

export function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
