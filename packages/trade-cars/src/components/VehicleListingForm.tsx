/**
 * VehicleListingForm — form fields for vehicle details.
 *
 * This is a reusable controlled form component for creating/editing
 * vehicle listings. It receives the core listing form as a wrapper
 * and renders vehicle-specific fields below.
 *
 * Imports ONLY from @nzila/trade-core (enums) and React.
 * Does NOT import from @nzila/db, @nzila/trade-db, or apps/trade.
 */
'use client'

import type { VehicleListingFormData } from '../types'
import {
  VehicleCondition,
  VehicleTransmission,
  VehicleDrivetrain,
  VehicleFuelType,
} from '@nzila/trade-core/enums'

interface VehicleListingFormProps {
  value: Partial<VehicleListingFormData>
  onChange: (updates: Partial<VehicleListingFormData>) => void
  disabled?: boolean
}

const YEAR_MIN = 1990
const YEAR_MAX = new Date().getFullYear() + 2

export function VehicleListingForm({
  value,
  onChange,
  disabled = false,
}: VehicleListingFormProps) {
  return (
    <fieldset disabled={disabled} className="space-y-4">
      <legend className="text-lg font-semibold">Vehicle Details</legend>

      {/* VIN */}
      <div>
        <label htmlFor="vin" className="block text-sm font-medium">
          VIN
        </label>
        <input
          id="vin"
          type="text"
          maxLength={17}
          value={value.vin ?? ''}
          onChange={(e) => onChange({ vin: e.target.value.toUpperCase() })}
          className="mt-1 block w-full rounded-md border p-2"
          placeholder="e.g. 1HGBH41JXMN109186"
        />
      </div>

      {/* Make / Model / Year */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="make" className="block text-sm font-medium">
            Make
          </label>
          <input
            id="make"
            type="text"
            value={value.make ?? ''}
            onChange={(e) => onChange({ make: e.target.value })}
            className="mt-1 block w-full rounded-md border p-2"
            placeholder="Toyota"
          />
        </div>
        <div>
          <label htmlFor="model" className="block text-sm font-medium">
            Model
          </label>
          <input
            id="model"
            type="text"
            value={value.model ?? ''}
            onChange={(e) => onChange({ model: e.target.value })}
            className="mt-1 block w-full rounded-md border p-2"
            placeholder="Land Cruiser"
          />
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium">
            Year
          </label>
          <input
            id="year"
            type="number"
            min={YEAR_MIN}
            max={YEAR_MAX}
            value={value.year ?? ''}
            onChange={(e) => onChange({ year: parseInt(e.target.value, 10) })}
            className="mt-1 block w-full rounded-md border p-2"
          />
        </div>
      </div>

      {/* Trim / Mileage */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="trim" className="block text-sm font-medium">
            Trim (optional)
          </label>
          <input
            id="trim"
            type="text"
            value={value.trim ?? ''}
            onChange={(e) => onChange({ trim: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border p-2"
            placeholder="GX, VX, etc."
          />
        </div>
        <div>
          <label htmlFor="mileage" className="block text-sm font-medium">
            Mileage (km)
          </label>
          <input
            id="mileage"
            type="number"
            min={0}
            value={value.mileage ?? ''}
            onChange={(e) => onChange({ mileage: parseInt(e.target.value, 10) })}
            className="mt-1 block w-full rounded-md border p-2"
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <label htmlFor="condition" className="block text-sm font-medium">
          Condition
        </label>
        <select
          id="condition"
          value={value.condition ?? ''}
          onChange={(e) => onChange({ condition: e.target.value as VehicleListingFormData['condition'] })}
          className="mt-1 block w-full rounded-md border p-2"
        >
          <option value="">Select condition</option>
          {Object.values(VehicleCondition).map((v) => (
            <option key={v} value={v}>
              {v.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Transmission / Drivetrain / Fuel */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="transmission" className="block text-sm font-medium">
            Transmission
          </label>
          <select
            id="transmission"
            value={value.transmission ?? ''}
            onChange={(e) =>
              onChange({ transmission: e.target.value as VehicleListingFormData['transmission'] })
            }
            className="mt-1 block w-full rounded-md border p-2"
          >
            <option value="">Select</option>
            {Object.values(VehicleTransmission).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="drivetrain" className="block text-sm font-medium">
            Drivetrain
          </label>
          <select
            id="drivetrain"
            value={value.drivetrain ?? ''}
            onChange={(e) =>
              onChange({ drivetrain: e.target.value as VehicleListingFormData['drivetrain'] })
            }
            className="mt-1 block w-full rounded-md border p-2"
          >
            <option value="">Select</option>
            {Object.values(VehicleDrivetrain).map((v) => (
              <option key={v} value={v}>
                {v.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fuelType" className="block text-sm font-medium">
            Fuel Type
          </label>
          <select
            id="fuelType"
            value={value.fuelType ?? ''}
            onChange={(e) =>
              onChange({ fuelType: e.target.value as VehicleListingFormData['fuelType'] })
            }
            className="mt-1 block w-full rounded-md border p-2"
          >
            <option value="">Select</option>
            {Object.values(VehicleFuelType).map((v) => (
              <option key={v} value={v}>
                {v.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Colors / Engine */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="extColor" className="block text-sm font-medium">
            Exterior Color
          </label>
          <input
            id="extColor"
            type="text"
            value={value.exteriorColor ?? ''}
            onChange={(e) => onChange({ exteriorColor: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border p-2"
          />
        </div>
        <div>
          <label htmlFor="intColor" className="block text-sm font-medium">
            Interior Color
          </label>
          <input
            id="intColor"
            type="text"
            value={value.interiorColor ?? ''}
            onChange={(e) => onChange({ interiorColor: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border p-2"
          />
        </div>
        <div>
          <label htmlFor="engineSize" className="block text-sm font-medium">
            Engine Size
          </label>
          <input
            id="engineSize"
            type="text"
            value={value.engineSize ?? ''}
            onChange={(e) => onChange({ engineSize: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border p-2"
            placeholder="4.5L V8"
          />
        </div>
      </div>
    </fieldset>
  )
}
