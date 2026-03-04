/**
 * @nzila/platform-rfp-generator — barrel exports
 */

// types
export type {
  RfpSection,
  RfpAnswer,
  RfpResponse,
  RfpSectionResponse,
  RfpGeneratorInput,
} from './types'

export { RFP_SECTIONS, rfpAnswerSchema } from './types'

// generator
export { generateRfpResponse, renderRfpMarkdown } from './generator'
