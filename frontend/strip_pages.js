const fs = require("fs");
function stripBom(f) {
  try {
    let c = fs.readFileSync(f, "utf8");
    if (c.charCodeAt(0) === 0xFEFF) { c = c.slice(1); fs.writeFileSync(f, c, "utf8"); return "stripped"; }
    return "ok";
  } catch(e) { return "err:" + e.message; }
}

const base = "c:/Users/husni/OneDrive/Desktop/AURA/frontend";
const id_page = base + "/app/scans/[id]/page.tsx";
const report_page = base + "/app/scans/[id]/report/page.tsx";

console.log("scan page:", stripBom(id_page));
console.log("report page:", stripBom(report_page));