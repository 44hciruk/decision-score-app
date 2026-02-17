import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from "react";
import {
  type Project,
  type AppSettings,
  loadProjects,
  saveProject,
  deleteProject as deleteProjectFromStorage,
  loadSettings,
  saveSettings as saveSettingsToStorage,
  FREE_LIMITS,
  PREMIUM_LIMITS,
} from "./storage";

// ============================================================
// State
// ============================================================

interface AppState {
  projects: Project[];
  settings: AppSettings;
  isLoading: boolean;
}

type Action =
  | { type: "SET_PROJECTS"; payload: Project[] }
  | { type: "ADD_PROJECT"; payload: Project }
  | { type: "UPDATE_PROJECT"; payload: Project }
  | { type: "DELETE_PROJECT"; payload: string }
  | { type: "SET_SETTINGS"; payload: AppSettings }
  | { type: "SET_LOADING"; payload: boolean };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_PROJECTS":
      return { ...state, projects: action.payload, isLoading: false };
    case "ADD_PROJECT":
      return { ...state, projects: [action.payload, ...state.projects] };
    case "UPDATE_PROJECT":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case "DELETE_PROJECT":
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
      };
    case "SET_SETTINGS":
      return { ...state, settings: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

interface ProjectContextType {
  state: AppState;
  addProject: (project: Project) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  getLimits: () => { candidates: number; criteria: number; projects: number };
  canAddProject: () => boolean;
  refresh: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    projects: [],
    settings: { isPremium: false, colorScheme: "system" },
    isLoading: true,
  });

  const loadData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    const [projects, settings] = await Promise.all([
      loadProjects(),
      loadSettings(),
    ]);
    dispatch({ type: "SET_PROJECTS", payload: projects });
    dispatch({ type: "SET_SETTINGS", payload: settings });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addProject = useCallback(
    async (project: Project) => {
      dispatch({ type: "ADD_PROJECT", payload: project });
      await saveProject(project);
    },
    []
  );

  const updateProject = useCallback(
    async (project: Project) => {
      dispatch({ type: "UPDATE_PROJECT", payload: project });
      await saveProject(project);
    },
    []
  );

  const removeProject = useCallback(
    async (id: string) => {
      dispatch({ type: "DELETE_PROJECT", payload: id });
      await deleteProjectFromStorage(id);
    },
    []
  );

  const updateSettings = useCallback(
    async (settings: AppSettings) => {
      dispatch({ type: "SET_SETTINGS", payload: settings });
      await saveSettingsToStorage(settings);
    },
    []
  );

  const getLimits = useCallback(() => {
    return state.settings.isPremium ? PREMIUM_LIMITS : FREE_LIMITS;
  }, [state.settings.isPremium]);

  const canAddProject = useCallback(() => {
    const limits = state.settings.isPremium ? PREMIUM_LIMITS : FREE_LIMITS;
    return state.projects.length < limits.projects;
  }, [state.projects.length, state.settings.isPremium]);

  return (
    <ProjectContext.Provider
      value={{
        state,
        addProject,
        updateProject,
        removeProject,
        updateSettings,
        getLimits,
        canAddProject,
        refresh: loadData,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext(): ProjectContextType {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProjectContext must be used within ProjectProvider");
  }
  return ctx;
}
