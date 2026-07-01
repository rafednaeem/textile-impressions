export function extractSettings(
  data: { key: string; value: string }[] | null
): Record<string, string> {
  const map: Record<string, string> = {}
  if (data) data.forEach((s) => { map[s.key] = s.value })
  return map
}
