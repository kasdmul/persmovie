
'use client';

import type React from 'react';
import { useState, useEffect } from 'react';

// --- Types ---
export type Employee = {
  matricule: string;
  noms: string;
  email: string;
  sexe: 'Homme' | 'Femme' | 'N/A';
  entite: string;
  departement: string;
  poste: string;
  lieuTravail: string;
  salaire: number;
  typeContrat: string;
  dateEmbauche: string; // "Date de Début"
  periodeEssai: number; // in months
  status: 'Actif' | 'Parti';
  dateDepart?: string;
};

export type OpenPosition = {
  id: string;
  title: string;
  type: 'Remplacement' | 'Création';
  openingDate: string;
  filledDate?: string;
  description: string;
  status: 'Ouvert' | 'Pourvu' | 'Annulé';
  cost?: number;
};

export type User = {
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'membre';
  password?: string;
};

export type SalaryChange = {
  date: string;
  matricule: string;
  noms: string;
  ancienneValeur: number;
  nouvelleValeur: number;
  motif: string;
};

export type FunctionChange = {
  date: string;
  matricule: string;
  noms: string;
  ancienneValeur: string;
  nouvelleValeur: string;
  motif: string;
};

export type ContractChange = {
  date: string;
  matricule: string;
  noms: string;
  ancienneValeur: string;
  nouvelleValeur: string;
  motif: string;
};

export type DepartmentChange = {
  date: string;
  matricule: string;
  noms:string;
  ancienneValeur: string;
  nouvelleValeur: string;
  motif: string;
};

export type EntityChange = {
  date: string;
  matricule: string;
  noms: string;
  ancienneValeur: string;
  nouvelleValeur: string;
  motif: string;
};

export type WorkLocationChange = {
  date: string;
  matricule: string;
  noms: string;
  ancienneValeur: string;
  nouvelleValeur: string;
  motif: string;
  droitPrimeEloignement: boolean;
  pourcentagePrime?: number;
  dureeAffectationMois?: number;
};

type StoreType = {
  employees: Employee[];
  openPositions: OpenPosition[];
  users: User[];
  currentUser: User | null;
  salaryHistory: SalaryChange[];
  functionHistory: FunctionChange[];
  contractHistory: ContractChange[];
  departmentHistory: DepartmentChange[];
  entityHistory: EntityChange[];
  workLocationHistory: WorkLocationChange[];
  departments: string[];
  entities: string[];
  workLocations: string[];
};


// --- Data Store ---
const initialData: StoreType = {
  employees: [],
  openPositions: [],
  users: [],
  currentUser: null,
  salaryHistory: [],
  functionHistory: [],
  contractHistory: [],
  departmentHistory: [],
  entityHistory: [],
  workLocationHistory: [],
  departments: [],
  entities: [],
  workLocations: [],
};

export let store: StoreType = { ...initialData };

// --- State Management ---
let listeners: React.Dispatch<React.SetStateAction<number>>[] = [];
let dataIsLoaded = false;
let dataIsLoading = false;
let saveTimeout: NodeJS.Timeout | null = null;
const LOCAL_STORAGE_KEY = 'rh-insights-data';

async function loadData() {
  if (dataIsLoaded || dataIsLoading) return;
  dataIsLoading = true;
  try {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      store = JSON.parse(savedData);
    } else {
      // First time load: fetch from the initial db.json via the API
      const response = await fetch('/api/data');
      const dataFromServer = await response.json();
      store = { ...initialData, ...dataFromServer };
      // Save this initial state to localStorage for next time
      const initialStoreToSave = { ...store, currentUser: null };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialStoreToSave));
    }
  } catch (error) {
    console.error("Couldn't load data, using initial data.", error);
    store = { ...initialData };
  } finally {
    dataIsLoaded = true;
    dataIsLoading = false;
    // Notify components that data is available
    listeners.forEach((listener) => listener((c) => c + 1));
  }
}


function saveData() {
  if (!dataIsLoaded) return; // Don't save if data hasn't been loaded yet.
  try {
    const dataToSave = JSON.parse(JSON.stringify(store));
    // We don't want to save the current user to localStorage across sessions
    dataToSave.currentUser = null;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error("Couldn't save data to localStorage.", error);
  }
}

const debouncedSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveData();
  }, 500); // Debounce saves by 500ms
};


export function useStore() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    listeners.push(forceUpdate);
    if (!dataIsLoaded && !dataIsLoading) {
      loadData();
    }
    return () => {
      listeners = listeners.filter((l) => l !== forceUpdate);
    };
  }, []);

  return { store, isLoaded: dataIsLoaded };
}

export function notify(shouldSave = true) {
  if (shouldSave && dataIsLoaded) {
    debouncedSave();
  }
  listeners.forEach((listener) => listener((c) => c + 1));
}
