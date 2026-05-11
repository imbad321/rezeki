import { getDocuments } from "@/lib/data/documents"
import { DocumentVault } from "@/components/documents/DocumentVault"

export default async function DocumentsPage() {
  const docs = await getDocuments()
  return <DocumentVault initialDocs={docs} />
}
