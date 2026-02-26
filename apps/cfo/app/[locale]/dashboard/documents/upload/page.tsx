/**
 * CFO — Document Upload Page.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DocumentUploadForm } from '@/components/document-upload-form'

export default async function DocumentUploadPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-poppins text-2xl font-bold text-foreground">Upload Document</h2>
        <p className="mt-1 text-sm text-muted-foreground">Upload invoices, receipts, contracts, or statements</p>
      </div>
      <DocumentUploadForm />
    </div>
  )
}
