/**
 * VehicleDocsChecklist — displays required vehicle docs with upload status.
 *
 * Renders a checklist of vehicle document types with their upload status.
 * Imports ONLY from @nzila/trade-core (enums) and React.
 */
'use client'

import { VehicleDocType } from '@nzila/trade-core/enums'
import type { VehicleDoc } from '../types'

interface VehicleDocsChecklistProps {
  requiredDocs: readonly string[]
  uploadedDocs: readonly VehicleDoc[]
  onUploadClick: (docType: string) => void
  disabled?: boolean
}

const DOC_LABELS: Record<string, string> = {
  [VehicleDocType.BILL_OF_SALE]: 'Bill of Sale',
  [VehicleDocType.EXPORT_CERTIFICATE]: 'Export Certificate',
  [VehicleDocType.INSPECTION_REPORT]: 'Inspection Report',
  [VehicleDocType.TITLE]: 'Vehicle Title',
  [VehicleDocType.CARFAX]: 'Carfax / History Report',
  [VehicleDocType.EMISSIONS_TEST]: 'Emissions Test',
  [VehicleDocType.SAFETY_INSPECTION]: 'Safety Inspection',
  [VehicleDocType.CUSTOMS_FORM]: 'Customs Declaration',
}

export function VehicleDocsChecklist({
  requiredDocs,
  uploadedDocs,
  onUploadClick,
  disabled = false,
}: VehicleDocsChecklistProps) {
  const uploadedTypes = new Set(uploadedDocs.map((d) => d.docType))

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Vehicle Documents</h3>
      <ul className="space-y-1">
        {requiredDocs.map((docType) => {
          const isUploaded = uploadedTypes.has(docType as typeof VehicleDocType[keyof typeof VehicleDocType])
          const label = DOC_LABELS[docType] ?? docType

          return (
            <li key={docType} className="flex items-center gap-2">
              <span
                className={`inline-block h-4 w-4 rounded-full ${
                  isUploaded ? 'bg-green-500' : 'bg-gray-300'
                }`}
                aria-label={isUploaded ? 'Uploaded' : 'Not uploaded'}
              />
              <span className={isUploaded ? 'line-through text-gray-500' : ''}>
                {label}
              </span>
              {!isUploaded && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onUploadClick(docType)}
                  className="ml-auto text-sm text-blue-600 hover:underline disabled:text-gray-400"
                >
                  Upload
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-gray-500">
        {uploadedTypes.size} of {requiredDocs.length} documents uploaded
      </p>
    </div>
  )
}
