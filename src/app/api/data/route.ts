
import { NextResponse } from 'next/server';
import initialDbData from '../../../../db.json';

// This route now ONLY serves the initial seed data from the committed db.json
// It does not handle saving data anymore, as that's done in localStorage.

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
    // The data is now imported directly, which is safer for build environments.
    return initialDbData;
  } catch (error) {
    console.error('Could not access initial db.json data, returning empty data structure.', error);
    // If db.json can't be imported for some reason, return a safe default.
    return emptyData;
  }
}

export async function GET() {
  const data = await getInitialData();
  // Ensure currentUser is not part of the initial seed data for security.
  if (data.currentUser) {
    data.currentUser = null;
  }
  return NextResponse.json(data);
}
