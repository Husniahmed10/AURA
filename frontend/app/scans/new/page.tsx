import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NewScanWizard from "@/components/scan/NewScanWizard";
export default function NewScanPage() {
  return (
    <div className="page-stack">
      <Link href="/scans" className="back-link">
        <ArrowLeft size={14} />
        Back to assessments
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ASSESSMENT SETUP</div>
          <h1>Meet your AI’s next challenge.</h1>
          <p>Define the target, choose your scope, and let AURA explore.</p>
        </div>
      </div>
      <NewScanWizard />
    </div>
  );
}
