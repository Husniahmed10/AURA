const fs = require("fs");
const path = require("path");

function stripBom(filePath) {
  try {
    let c = fs.readFileSync(filePath, "utf8");
    if (c.charCodeAt(0) === 0xFEFF) {
      c = c.slice(1);
      fs.writeFileSync(filePath, c, "utf8");
      return true;
    }
    return false;
  } catch(e) {
    return false;
  }
}

const files = [
  "app/layout.tsx",
  "app/page.tsx",
  "app/providers.tsx",
  "app/scans/new/page.tsx",
  "types/api.ts",
  "lib/api.ts",
  "components/ui/StatCard.tsx",
  "components/ui/StatusBadge.tsx",
  "components/ui/RiskGauge.tsx",
  "components/ui/ScanTable.tsx",
  "components/ui/VulnerabilityTable.tsx",
  "components/ui/ScanTimeline.tsx",
  "components/scan/NewScanWizard.tsx",
];

files.forEach(f => {
  const stripped = stripBom(f);
  console.log(f + ": " + (stripped ? "BOM stripped" : "OK"));
});