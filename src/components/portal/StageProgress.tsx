import { STAGE_META, type ProjectStage } from "@/lib/types";

export function StageProgress({
  stage,
  progress,
  nextStep,
}: {
  stage: ProjectStage;
  progress: number;
  nextStep: string | null;
}) {
  const currentLabel = STAGE_META[stage]?.clientLabel ?? stage;
  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <span className="text-2xl font-semibold tabular-nums">{progress}%</span>
        <span className="text-xs text-muted-2">Actualmente: {currentLabel}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {nextStep && <p className="mt-2 text-xs text-muted-2">Próximo paso: {nextStep}</p>}
    </div>
  );
}
