import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const filePath = path.join(process.cwd(), "data", "projects.json")

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data")
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// GET - Read projects
export async function GET() {
  try {
    await ensureDataDir()
    const fileContents = await fs.readFile(filePath, "utf8")
    const projects = JSON.parse(fileContents)
    return NextResponse.json(projects)
  } catch (error: any) {
    // If file doesn't exist, return empty array
    if (error.code === "ENOENT") {
      return NextResponse.json([])
    }
    return NextResponse.json(
      { error: "Failed to read projects" },
      { status: 500 }
    )
  }
}

// POST - Save projects
export async function POST(request: NextRequest) {
  try {
    await ensureDataDir()
    const projects = await request.json()
    await fs.writeFile(filePath, JSON.stringify(projects, null, 2), "utf8")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving projects:", error)
    return NextResponse.json(
      { error: "Failed to save projects" },
      { status: 500 }
    )
  }
}

