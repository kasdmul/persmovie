
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Path to the db.json file
const dbPath = path.join(process.cwd(), 'db.json');

// Default empty structure, similar to the initial state in the store.
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

async function getData() {
  try {
    const fileContents = await fs.readFile(dbPath, 'utf8');
    const data = JSON.parse(fileContents);
    return { ...emptyData, ...data };
  } catch (error) {
     // @ts-ignore
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it with empty data.
      try {
        await fs.writeFile(dbPath, JSON.stringify(emptyData, null, 2), 'utf8');
        return emptyData;
      } catch (writeError) {
        console.error('Error creating db.json:', writeError);
        return emptyData;
      }
    } else {
      console.error('Error reading db.json, returning empty data:', error);
      return emptyData;
    }
  }
}

export async function GET() {
  const data = await getData();
  // currentUser should be managed client-side.
  data.currentUser = null;
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // currentUser is session-specific and should not be persisted.
    if (data.currentUser) {
        data.currentUser = null;
    }
    
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');

    return NextResponse.json({ message: 'Data saved successfully.' });
  } catch (error) {
    console.error('Failed to save data to db.json:', error);
    return new NextResponse('Failed to save data', { status: 500 });
  }
}
