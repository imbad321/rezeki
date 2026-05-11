import { getDocuments } from "@/lib/data/documents"
import { type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get("category") ?? undefined
    const docs = await getDocuments(category)
    return Response.json(docs)
  } catch {
    return Response.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}
