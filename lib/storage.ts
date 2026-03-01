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
  candidates: 10,
  criteria: Infinity,
  projects: Infinity,
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
    icon: "scale.3d",
    criteria: ["価格", "味", "雰囲気", "アクセス", "接客"],
  },
  {
    id: "job",
    name: "就職先",
    icon: "chart.bar.fill",
    criteria: ["給与", "やりがい", "勤務地", "福利厚生", "成長性"],
  },
  {
    id: "housing",
    name: "住居",
    icon: "doc.text.fill",
    criteria: ["家賃", "広さ", "駅からの距離", "築年数", "周辺環境"],
  },
  {
    id: "travel",
    name: "旅行先",
    icon: "star.fill",
    criteria: ["費用", "観光スポット", "食事", "アクセス", "安全性"],
  },
  {
    id: "product",
    name: "商品比較",
    icon: "bookmark.fill",
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
  const rawScores: number[] = new Array(n).fill(0);

  for (const criterion of criteria) {
    const ordered = rankings[criterion];
    if (!ordered) continue;
    const assigned = new Set<number>();
    for (let rankPos = 0; rankPos < ordered.length; rankPos++) {
      const name = ordered[rankPos];
      for (let ci = 0; ci < n; ci++) {
        if (candidates[ci] === name && !assigned.has(ci)) {
          assigned.add(ci);
          rawScores[ci] += n - rankPos;
          break;
        }
      }
    }
  }

  const maxRaw = criteria.length * n;
  const scores: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    scores[candidates[i]] = maxRaw > 0
      ? Math.round((rawScores[i] / maxRaw) * 100)
      : 0;
  }
  return scores;
}

export function getConfidenceMessage(diff: number): string {
  if (diff >= 15) return "圧倒的で迷わず選べます";
  if (diff >= 10) return "明確な差があります";
  if (diff >= 5) return "やや優勢です";
  return "僅差でした";
}

export function getScoreColor(score: number): string {
  if (score >= 90) return "#22C55E"; // green (1st place)
  if (score >= 75) return "#F59E0B"; // orange (2nd place)
  if (score >= 60) return "#EF4444"; // red (last place)
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
