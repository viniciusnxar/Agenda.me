"use client";

import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { savePlans, type PlanInput } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type EditablePlan = PlanInput & { key: string };

export function PlansEditor({ plans: initial }: { plans: { id: string; name: string; is_active: boolean }[] }) {
  const [plans, setPlans] = useState<EditablePlan[]>(initial.map((p) => ({ ...p, key: p.id })));
  const [saving, startSaving] = useTransition();

  const update = (key: string, patch: Partial<EditablePlan>) =>
    setPlans((ps) => ps.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  function move(index: number, delta: number) {
    setPlans((ps) => {
      const next = [...ps];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });
  }

  function save() {
    startSaving(async () => {
      const result = await savePlans(plans.map((p) => ({ id: p.id, name: p.name, is_active: p.is_active })));
      if (result.ok) toast.success("Planos salvos");
      else toast.error(result.error);
    });
  }

  return (
    <div className="grid gap-4">
      {plans.length === 0 && <p className="text-sm text-muted-foreground">Nenhum plano cadastrado.</p>}
      <ul className="grid gap-2">
        {plans.map((plan, i) => (
          <li key={plan.key} className="flex items-center gap-2">
            <Input
              value={plan.name}
              maxLength={80}
              placeholder="Nome do plano ou convênio"
              onChange={(e) => update(plan.key, { name: e.target.value })}
              aria-label={`Nome do plano ${i + 1}`}
            />
            <Switch
              checked={plan.is_active}
              onCheckedChange={(v) => update(plan.key, { is_active: v })}
              aria-label={`Plano ${i + 1} ativo`}
            />
            <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Subir plano ${i + 1}`}>
              <ArrowUp />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={i === plans.length - 1}
              onClick={() => move(i, 1)}
              aria-label={`Descer plano ${i + 1}`}
            >
              <ArrowDown />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPlans((ps) => ps.filter((p) => p.key !== plan.key))}
              aria-label={`Remover plano ${i + 1}`}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={plans.length >= 50}
          onClick={() => setPlans((ps) => [...ps, { key: crypto.randomUUID(), name: "", is_active: true }])}
        >
          <Plus aria-hidden="true" /> Adicionar plano
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
          Salvar planos
        </Button>
      </div>
    </div>
  );
}
