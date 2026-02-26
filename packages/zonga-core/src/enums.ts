/**
 * @nzila/zonga-core — Enums & Status Codes
 *
 * Content platform domain enumerations.
 * No DB, no framework — pure TypeScript.
 *
 * @module @nzila/zonga-core/enums
 */

// ── Creator ─────────────────────────────────────────────────────────────────

export const CreatorStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
} as const
export type CreatorStatus = (typeof CreatorStatus)[keyof typeof CreatorStatus]

// ── Content Asset ───────────────────────────────────────────────────────────

export const AssetType = {
  TRACK: 'track',
  ALBUM: 'album',
  VIDEO: 'video',
  PODCAST: 'podcast',
} as const
export type AssetType = (typeof AssetType)[keyof typeof AssetType]

export const AssetStatus = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  REVIEW: 'review',
  PUBLISHED: 'published',
  TAKEN_DOWN: 'taken_down',
  ARCHIVED: 'archived',
} as const
export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus]

// ── Release ─────────────────────────────────────────────────────────────────

export const ReleaseStatus = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  RELEASED: 'released',
  WITHDRAWN: 'withdrawn',
} as const
export type ReleaseStatus = (typeof ReleaseStatus)[keyof typeof ReleaseStatus]

// ── Revenue ─────────────────────────────────────────────────────────────────

export const RevenueType = {
  STREAM: 'stream',
  DOWNLOAD: 'download',
  TIP: 'tip',
  SUBSCRIPTION_SHARE: 'subscription_share',
  TICKET_SALE: 'ticket_sale',
  MERCHANDISE: 'merchandise',
  SYNC_LICENSE: 'sync_license',
} as const
export type RevenueType = (typeof RevenueType)[keyof typeof RevenueType]

// ── Payout ──────────────────────────────────────────────────────────────────

export const PayoutStatus = {
  PENDING: 'pending',
  PREVIEWED: 'previewed',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus]

// ── Payout Rail — how the creator receives money ────────────────────────────

export const PayoutRail = {
  STRIPE_CONNECT: 'stripe_connect',
  MPESA: 'mpesa',
  MTN_MOMO: 'mtn_momo',
  AIRTEL_MONEY: 'airtel_money',
  ORANGE_MONEY: 'orange_money',
  BANK_TRANSFER: 'bank_transfer',
  CHIPPER_CASH: 'chipper_cash',
  FLUTTERWAVE: 'flutterwave',
} as const
export type PayoutRail = (typeof PayoutRail)[keyof typeof PayoutRail]

// ── Ledger ──────────────────────────────────────────────────────────────────

export const LedgerEntryType = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  HOLD: 'hold',
  RELEASE: 'release',
} as const
export type LedgerEntryType = (typeof LedgerEntryType)[keyof typeof LedgerEntryType]

// ── Zonga Role (org-scoped) ─────────────────────────────────────────────────

export const ZongaRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CREATOR: 'creator',
  VIEWER: 'viewer',
} as const
export type ZongaRole = (typeof ZongaRole)[keyof typeof ZongaRole]

// ── African Currencies ──────────────────────────────────────────────────────

/**
 * Supported currencies. Platform-wide default is USD but creators
 * earn and are paid in their local currency where possible.
 */
export const ZongaCurrency = {
  USD: 'USD',
  CAD: 'CAD',
  EUR: 'EUR',
  GBP: 'GBP',
  // ── West Africa ──
  NGN: 'NGN', // Nigerian Naira
  XOF: 'XOF', // CFA Franc BCEAO (Senegal, Mali, Côte d'Ivoire, Burkina Faso, Benin, Togo, Niger, Guinea-Bissau)
  GHS: 'GHS', // Ghanaian Cedi
  // ── East Africa ──
  KES: 'KES', // Kenyan Shilling
  TZS: 'TZS', // Tanzanian Shilling
  UGX: 'UGX', // Ugandan Shilling
  ETB: 'ETB', // Ethiopian Birr
  RWF: 'RWF', // Rwandan Franc
  // ── Central Africa ──
  XAF: 'XAF', // CFA Franc BEAC (Cameroon, Congo, Gabon, Chad, CAR, Equatorial Guinea)
  CDF: 'CDF', // Congolese Franc (DRC)
  // ── Southern Africa ──
  ZAR: 'ZAR', // South African Rand
  BWP: 'BWP', // Botswana Pula
  ZMW: 'ZMW', // Zambian Kwacha
  // ── North Africa ──
  MAD: 'MAD', // Moroccan Dirham
  EGP: 'EGP', // Egyptian Pound
} as const
export type ZongaCurrency = (typeof ZongaCurrency)[keyof typeof ZongaCurrency]

// ── African Genre Taxonomy ──────────────────────────────────────────────────

/**
 * Curated genre taxonomy for African music. Organized by region.
 * Creators may also supply free-text sub-genres via metadata.
 */
export const AfricanGenre = {
  // ── Pan-African / Global ──
  AFROBEATS: 'afrobeats',
  AFROPOP: 'afropop',
  AFRO_SOUL: 'afro_soul',
  AFRO_RNB: 'afro_rnb',
  AFRO_HOUSE: 'afro_house',
  AFRO_JAZZ: 'afro_jazz',
  AFRO_FUSION: 'afro_fusion',
  AFRO_GOSPEL: 'afro_gospel',
  AFRO_HIP_HOP: 'afro_hip_hop',
  AFRO_DANCEHALL: 'afro_dancehall',
  AFRO_TRAP: 'afro_trap',
  AFRO_CLASSICAL: 'afro_classical',

  // ── West Africa ──
  HIGHLIFE: 'highlife',
  JUJU: 'juju',
  FUJI: 'fuji',
  APALA: 'apala',
  HIPLIFE: 'hiplife',
  AZONTO: 'azonto',
  PALM_WINE: 'palm_wine',
  MBALAX: 'mbalax',
  WASSOULOU: 'wassoulou',
  GRIOT: 'griot',
  COUPE_DECALE: 'coupe_decale',
  ZOUGLOU: 'zouglou',

  // ── East Africa ──
  BONGO_FLAVA: 'bongo_flava',
  GENGETONE: 'gengetone',
  BENGA: 'benga',
  TAARAB: 'taarab',
  OHANGLA: 'ohangla',
  MUGITHI: 'mugithi',
  KADONGO_KAMU: 'kadongo_kamu',
  ETHIO_JAZZ: 'ethio_jazz',

  // ── Central Africa ──
  NDOMBOLO: 'ndombolo',
  SOUKOUS: 'soukous',
  RUMBA_CONGOLAISE: 'rumba_congolaise',
  MAKOSSA: 'makossa',
  BIKUTSI: 'bikutsi',
  BEND_SKIN: 'bend_skin',

  // ── Southern Africa ──
  AMAPIANO: 'amapiano',
  GQOM: 'gqom',
  KWAITO: 'kwaito',
  MASKANDI: 'maskandi',
  MARRABENTA: 'marrabenta',
  CHIMURENGA: 'chimurenga',
  SUNGURA: 'sungura',
  KIZOMBA: 'kizomba',
  SEMBA: 'semba',
  KUDURO: 'kuduro',

  // ── North Africa ──
  RAI: 'rai',
  GNAWA: 'gnawa',
  CHAABI: 'chaabi',
  MAHRAGANAT: 'mahraganat',

  // ── Diaspora / Contemporary ──
  ALTÉ: 'alté',
  DRILL_AFRO: 'drill_afro',
  AMAPIANO_TECH: 'amapiano_tech',
  AFRO_ELECTRONIC: 'afro_electronic',

  // ── Non-African (for international content) ──
  POP: 'pop',
  HIP_HOP: 'hip_hop',
  RNB: 'rnb',
  GOSPEL: 'gospel',
  JAZZ: 'jazz',
  REGGAE: 'reggae',
  DANCEHALL: 'dancehall',
  ELECTRONIC: 'electronic',
  CLASSICAL: 'classical',
  OTHER: 'other',
} as const
export type AfricanGenre = (typeof AfricanGenre)[keyof typeof AfricanGenre]

// ── Audio Quality Tier ──────────────────────────────────────────────────────

/**
 * Audio quality tiers for bandwidth-sensitive African markets.
 * Lower tiers preserve data while maintaining acceptable quality.
 */
export const AudioQuality = {
  LOW: 'low',       // 32 kbps — 2G / extreme data saving
  MEDIUM: 'medium', // 64 kbps — 3G / balanced
  HIGH: 'high',     // 128 kbps — standard
  LOSSLESS: 'lossless', // 320 kbps / FLAC — Wi-Fi / premium
} as const
export type AudioQuality = (typeof AudioQuality)[keyof typeof AudioQuality]

// ── Supported Languages ─────────────────────────────────────────────────────

/**
 * Supported content/metadata languages for African markets.
 * These are the languages in which content metadata (titles, descriptions)
 * and the platform UI can be localized.
 */
export const ZongaLanguage = {
  // ── International ──
  EN: 'en',   // English
  FR: 'fr',   // French (West/Central Africa)
  PT: 'pt',   // Portuguese (Lusophone Africa)
  AR: 'ar',   // Arabic (North Africa)
  ES: 'es',   // Spanish (Equatorial Guinea)

  // ── Major African Languages ──
  SW: 'sw',   // Swahili (East Africa)
  YO: 'yo',   // Yoruba (Nigeria)
  IG: 'ig',   // Igbo (Nigeria)
  HA: 'ha',   // Hausa (Nigeria, Niger, Ghana)
  AM: 'am',   // Amharic (Ethiopia)
  ZU: 'zu',   // Zulu (South Africa)
  XH: 'xh',   // Xhosa (South Africa)
  RW: 'rw',   // Kinyarwanda (Rwanda)
  LN: 'ln',   // Lingala (DRC, Congo)
  WO: 'wo',   // Wolof (Senegal)
  TW: 'tw',   // Twi/Akan (Ghana)
  SO: 'so',   // Somali
  TI: 'ti',   // Tigrinya (Eritrea, Ethiopia)
} as const
export type ZongaLanguage = (typeof ZongaLanguage)[keyof typeof ZongaLanguage]

// ── African Country Codes (ISO 3166-1 alpha-2) ─────────────────────────────

/**
 * African countries for creator registration, listener demographics,
 * and payout rail availability.
 */
export const AfricanCountry = {
  // West Africa
  NG: 'NG', // Nigeria
  GH: 'GH', // Ghana
  SN: 'SN', // Senegal
  CI: 'CI', // Côte d'Ivoire
  ML: 'ML', // Mali
  BF: 'BF', // Burkina Faso
  NE: 'NE', // Niger
  BJ: 'BJ', // Benin
  TG: 'TG', // Togo
  GN: 'GN', // Guinea
  SL: 'SL', // Sierra Leone
  LR: 'LR', // Liberia
  GM: 'GM', // Gambia
  GW: 'GW', // Guinea-Bissau
  CV: 'CV', // Cabo Verde

  // East Africa
  KE: 'KE', // Kenya
  TZ: 'TZ', // Tanzania
  UG: 'UG', // Uganda
  ET: 'ET', // Ethiopia
  RW: 'RW', // Rwanda
  BI: 'BI', // Burundi
  SO: 'SO', // Somalia
  ER: 'ER', // Eritrea
  DJ: 'DJ', // Djibouti
  SS: 'SS', // South Sudan

  // Central Africa
  CD: 'CD', // DRC (Congo-Kinshasa)
  CG: 'CG', // Congo-Brazzaville
  CM: 'CM', // Cameroon
  GA: 'GA', // Gabon
  TD: 'TD', // Chad
  CF: 'CF', // Central African Republic
  GQ: 'GQ', // Equatorial Guinea

  // Southern Africa
  ZA: 'ZA', // South Africa
  BW: 'BW', // Botswana
  ZM: 'ZM', // Zambia
  ZW: 'ZW', // Zimbabwe
  MZ: 'MZ', // Mozambique
  AO: 'AO', // Angola
  NA: 'NA', // Namibia
  MW: 'MW', // Malawi
  LS: 'LS', // Lesotho
  SZ: 'SZ', // Eswatini
  MG: 'MG', // Madagascar
  MU: 'MU', // Mauritius

  // North Africa
  MA: 'MA', // Morocco
  EG: 'EG', // Egypt
  DZ: 'DZ', // Algeria
  TN: 'TN', // Tunisia
  LY: 'LY', // Libya
  SD: 'SD', // Sudan
} as const
export type AfricanCountry = (typeof AfricanCountry)[keyof typeof AfricanCountry]
