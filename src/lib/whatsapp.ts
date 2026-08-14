export function buildWhatsAppInquiryUrl(
  phoneNumber: string | null | undefined,
  productName: string
): string | null {
  const cleaned = (phoneNumber || "").replace(/[^\d]/g, "")
  if (!cleaned) return null

  const text = `Hi, I'm interested in ${productName}. Could you please provide more details?`
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`
}
