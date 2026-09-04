/**
 * Request and response shapes shared across the service surface.
 *
 * These sit apart from the endpoint functions so that a pure module - the CSV
 * reader, a check script - can name them without importing the client.
 */

export interface ParsedRow {
  code: string
  description: string
  uom: string
  org: string
  annualQty: number
  unitPrice: number
  /** Units in store. Absent from most extracts; 0 means the source did not say. */
  stockOnHand: number
  /**
   * The source system's own material group, verbatim.
   *
   * Every ERP carries one and every ERP names it differently - MATKL in SAP, an
   * item catalog group in Oracle, a plain "Group" column in a spreadsheet. It is
   * worth reading rather than inferring, because a group the source already
   * assigned is better evidence than a keyword guess off the description.
   */
  family: string
}

export interface ColumnMapping {
  code: number
  description: number
  uom: number
  org: number
  annualQty: number
  unitPrice: number
  stockOnHand: number
  family: number
}

export interface IngestPreview {
  headers: string[]
  mapping: ColumnMapping
  rows: string[][]
  /** Rows the parser could not read, with the reason. */
  problems: { line: number; reason: string }[]
  confidence: Record<keyof ColumnMapping, number>
}
