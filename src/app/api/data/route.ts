
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// This route now ONLY serves the initial seed data from the committed db.json
// It does not handle saving data anymore, as that's done in localStorage.

const dbPath = path.join(process.cwd(), 'db.json');

const emptyData = {
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

async function getInitialData() {
  try {
    // This reads the db.json that is committed to your repository.
    const fileContents = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Could not read initial db.json, returning empty data structure.', error);
    // If db.json doesn't exist for some reason, return a safe default.
    return emptyData;
  }
}

export async function GET() {
  const data = await getInitialData();
  // Ensure currentUser is not part of the initial seed data.
  if (data.currentUser) {
    data.currentUser = null;
  }
  return NextResponse.json(data);
}

// The POST method is no longer needed as data is persisted in the browser's localStorage.
