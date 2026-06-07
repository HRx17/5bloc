export interface GSTResult {
  subtotal:    number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total:       number
}

export function calculateGST(subtotal: number, isInterstate: boolean): GSTResult {
  const gst = subtotal * 0.18
  return isInterstate
    ? { subtotal, cgst_amount: 0,       sgst_amount: 0,       igst_amount: gst,   total: subtotal + gst }
    : { subtotal, cgst_amount: gst / 2, sgst_amount: gst / 2, igst_amount: 0,     total: subtotal + gst }
}
