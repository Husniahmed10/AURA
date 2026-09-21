import { Check, Circle, Loader2 } from "lucide-react";
import type { ScanStatus } from "@/types/api";
const stages = [
  { key: "created", name: "Initialize", detail: "Prepare the assessment" },
  { key: "recon", name: "Discover", detail: "Map the application" },
  { key: "attacking", name: "Simulate", detail: "Run adversarial attempts" },
  { key: "evaluating", name: "Evaluate", detail: "Analyze responses" },
  { key: "reporting", name: "Report", detail: "Document the findings" },
  { key: "completed", name: "Complete", detail: "Ready for review" },
];
export default function ScanTimeline({ status }: { status: ScanStatus }) {
  const current = stages.findIndex((s) => s.key === status);
  const stopped = status === "failed" || status === "aborted";
  return (
    <div>
      {stopped && (
        <p className="field-error mb-4" role="status">
          {status === "failed"
            ? "Assessment failed. Review the error details below."
            : "Assessment stopped. No further attacks will run."}
        </p>
      )}
      <ol className="scan-pipeline">
        {stages.map((s, i) => {
          const done = status === "completed" || i < current;
          const active = !stopped && !done && i === current;
          return (
            <li
              key={s.key}
              className={done ? "done" : active ? "active" : ""}
              aria-current={active ? "step" : undefined}
            >
              <span className="pipeline-node">
                {done ? (
                  <Check size={14} />
                ) : active ? (
                  <Loader2 className="animate-spin-slow" size={14} />
                ) : (
                  <Circle size={7} />
                )}
              </span>
              <div>
                <strong>{s.name}</strong>
                <small>{s.detail}</small>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
