"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Database,
  Fingerprint,
  Loader2,
  LockKeyhole,
  Shield,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import type { AttackCategory, ScanConfigRequest } from "@/types/api";
const categories = [
  {
    id: "prompt_injection",
    name: "Prompt injection",
    description: "Malicious instructions and context manipulation.",
    icon: Fingerprint,
  },
  {
    id: "jailbreak",
    name: "Jailbreaking",
    description: "Safety boundaries and model alignment.",
    icon: Zap,
  },
  {
    id: "data_extraction",
    name: "Data extraction",
    description: "Sensitive data and system prompt exposure.",
    icon: Database,
  },
  {
    id: "guardrail_bypass",
    name: "Guardrail bypass",
    description: "Content filters and protective controls.",
    icon: LockKeyhole,
  },
  {
    id: "agent_specific",
    name: "Agent attacks",
    description: "Tool use, permissions, and agent workflows.",
    icon: Bot,
  },
] satisfies {
  id: AttackCategory;
  name: string;
  description: string;
  icon: typeof Shield;
}[];
const schema = z.object({
  target_url: z
    .string()
    .url("Enter a valid application URL.")
    .refine(
      (url) => /^https?:\/\//i.test(url),
      "Use an HTTP or HTTPS endpoint.",
    ),
  scope: z
    .array(
      z.enum([
        "prompt_injection",
        "jailbreak",
        "data_extraction",
        "guardrail_bypass",
        "agent_specific",
      ]),
    )
    .min(1, "Choose at least one attack category."),
  max_attacks: z
    .number()
    .int()
    .min(10, "Use at least 10 attempts.")
    .max(500, "Use no more than 500 attempts."),
  timeout_seconds: z
    .number()
    .int()
    .min(60, "Allow at least 60 seconds.")
    .max(3600, "Use no more than 3,600 seconds."),
});
type Values = z.infer<typeof schema>;
export default function NewScanWizard() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      target_url: "",
      scope: categories.map((c) => c.id),
      max_attacks: 50,
      timeout_seconds: 300,
    },
  });
  const values = useWatch({ control });
  const scope = values.scope ?? [];
  const mutation = useMutation({
    mutationFn: (data: ScanConfigRequest) => api.startScan(data),
    onSuccess: (res) => router.push(`/scans/${res.scan_id}`),
  });
  async function next() {
    if (await trigger(step === 0 ? "target_url" : "scope")) setStep(step + 1);
  }
  return (
    <form
      onSubmit={handleSubmit((data) => {
        if (step === 2) mutation.mutate(data);
      })}
      className="wizard-layout"
    >
      <div className="wizard-main">
        <ol className="wizard-steps" aria-label="Assessment setup progress">
          {["Target", "Attack scope", "Review & launch"].map((name, i) => (
            <li
              key={name}
              className={`wizard-step ${i === step ? "current" : ""}`}
              aria-current={i === step ? "step" : undefined}
            >
              <span>{i < step ? <Check size={12} /> : i + 1}</span>
              {name}
            </li>
          ))}
        </ol>
        <fieldset disabled={mutation.isPending} className="panel wizard-card">
          {step === 0 && (
            <>
              <h2>What would you like to assess?</h2>
              <p>
                Start with the endpoint of your AI application. AURA will
                explore how it responds to adversarial inputs.
              </p>
              <label className="field-label" htmlFor="target_url">
                Application endpoint
              </label>
              <input
                id="target_url"
                className="input-field"
                placeholder="https://your-application.com/chat"
                aria-invalid={!!errors.target_url}
                aria-describedby="target-help target-error"
                {...register("target_url")}
              />
              <p className="field-help" id="target-help">
                Include http:// or https:// and the application’s endpoint path.
              </p>
              {errors.target_url && (
                <p className="field-error" id="target-error" role="alert">
                  {errors.target_url.message}
                </p>
              )}
              <div className="review-callout">
                <ShieldCheck size={16} />
                <span>
                  A clear target is the starting point for a useful assessment.
                  Results will include evidence and practical remediation
                  guidance.
                </span>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h2>Choose your attack surface.</h2>
              <p>
                Select the areas you want AURA to evaluate. All five categories
                are included by default.
              </p>
              <div className="category-list">
                {categories.map(({ id, name, description, icon: Icon }) => (
                  <label className="category-option" key={id}>
                    <Icon size={20} />
                    <span>
                      <strong>{name}</strong>
                      <small>{description}</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={scope.includes(id)}
                      onChange={(e) =>
                        setValue(
                          "scope",
                          e.target.checked
                            ? [...scope, id]
                            : scope.filter((c) => c !== id),
                          { shouldValidate: true },
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              {errors.scope && (
                <p role="alert" className="field-error">
                  {errors.scope.message}
                </p>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <h2>Set the boundaries. Start exploring.</h2>
              <p>
                Choose the assessment budget and review your configuration
                before launching.
              </p>
              <div className="budget-fields">
                <div>
                  <label className="field-label" htmlFor="max_attacks">
                    Maximum attack attempts
                  </label>
                  <input
                    id="max_attacks"
                    className="input-field"
                    type="number"
                    min={10}
                    max={500}
                    aria-invalid={!!errors.max_attacks}
                    {...register("max_attacks", { valueAsNumber: true })}
                  />
                  <p className="field-help">10–500 attempts per assessment.</p>
                  {errors.max_attacks && (
                    <p role="alert" className="field-error">
                      {errors.max_attacks.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="field-label" htmlFor="timeout_seconds">
                    Time limit, in seconds
                  </label>
                  <input
                    id="timeout_seconds"
                    className="input-field"
                    type="number"
                    min={60}
                    max={3600}
                    aria-invalid={!!errors.timeout_seconds}
                    {...register("timeout_seconds", { valueAsNumber: true })}
                  />
                  <p className="field-help">60–3,600 seconds.</p>
                  {errors.timeout_seconds && (
                    <p role="alert" className="field-error">
                      {errors.timeout_seconds.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="review-callout">
                <Shield size={16} />
                <span>
                  Your assessment will move through reconnaissance, attack
                  simulation, evaluation, and reporting. Follow its progress on
                  the next screen.
                </span>
              </div>
              {mutation.isError && (
                <p className="field-error" role="alert">
                  The assessment could not be started. Check your backend
                  connection and try again.
                </p>
              )}
            </>
          )}
        </fieldset>
        <div className="wizard-nav">
          {step > 0 ? (
            <button
              type="button"
              className="btn-secondary"
              disabled={mutation.isPending}
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={14} />
              Back
            </button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <button type="button" className="btn-primary" onClick={next}>
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="submit"
              className="btn-primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ArrowRight size={15} />
              )}
              {mutation.isPending
                ? "Launching assessment…"
                : "Launch assessment"}
            </button>
          )}
        </div>
      </div>
      <aside className="panel wizard-aside">
        <ShieldCheck size={28} />
        <h3>Your assessment, at a glance.</h3>
        <p>
          A focused security evaluation, with every step visible and every
          finding backed by evidence.
        </p>
        <div className="summary-row">
          <span>Target</span>
          <strong>{values.target_url || "Not configured"}</strong>
        </div>
        <div className="summary-row">
          <span>Attack categories</span>
          <strong>{scope.length} of 5</strong>
        </div>
        <div className="summary-row">
          <span>Attack budget</span>
          <strong>
            {Number.isFinite(values.max_attacks) ? values.max_attacks : "—"}
          </strong>
        </div>
        <div className="summary-row">
          <span>Time limit</span>
          <strong>
            {Number.isFinite(values.timeout_seconds)
              ? `${values.timeout_seconds}s`
              : "—"}
          </strong>
        </div>
        <div className="summary-row">
          <span>Outputs</span>
          <strong>Report + PDF</strong>
        </div>
      </aside>
    </form>
  );
}
