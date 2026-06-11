import type { Metadata } from "next"
import { storeName, baseUrl } from "@/lib/constants"
import SkillsStudioContent from "./SkillsStudioContent"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Skills Studio — ${storeName}`,
    description: "Learn. Create. Earn. Professional textile craft training for everyone. Join our workshops in natural dyeing, block printing, and fabric painting.",
    openGraph: {
      title: `Skills Studio — ${storeName}`,
      description: "Professional textile craft training for everyone.",
      url: `${baseUrl}/skills-studio`,
      type: "website",
    },
  }
}

export default function SkillsStudioPage() {
  return <SkillsStudioContent />
}