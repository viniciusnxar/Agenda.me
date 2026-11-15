"use client";

import { ArrowDown, ArrowUp, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  removeAvatar,
  saveSocialLinks,
  updateProfile,
  uploadAvatar,
  type SocialLinkInput,
} from "@/app/dashboard/actions";
import { FormField } from "@/components/form-field";
import { ProfileHeader } from "@/components/public/profile-header";
import { SocialCard } from "@/components/public/social-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatPhone } from "@/lib/format";
import { PLATFORM_INFO, PLATFORMS, type Platform } from "@/lib/social";
import { THEMES, type ThemeKey } from "@/lib/theme";
import { cn } from "@/lib/utils";

const TIMEZONES = [
  ["America/Sao_Paulo", "Brasília (SP, RJ, MG, Sul, GO, DF)"],
  ["America/Bahia", "Bahia"],
  ["America/Fortaleza", "Fortaleza (CE, RN, PB, PI, MA)"],
  ["America/Recife", "Recife (PE)"],
  ["America/Maceio", "Maceió (AL, SE)"],
  ["America/Belem", "Belém (PA, AP)"],
  ["America/Araguaina", "Tocantins"],
  ["America/Cuiaba", "Cuiabá (MT)"],
  ["America/Campo_Grande", "Campo Grande (MS)"],
  ["America/Manaus", "Manaus (AM)"],
  ["America/Porto_Velho", "Porto Velho (RO)"],
  ["America/Boa_Vista", "Boa Vista (RR)"],
  ["America/Rio_Branco", "Rio Branco (AC)"],
  ["America/Noronha", "Fernando de Noronha"],
] as const;

type EditorProfile = {
  username: string;
  full_name: string;
  profession: string | null;
  registration: string | null;
  bio: string | null;
  whatsapp: string | null;
  timezone: string;
  theme: string;
  avatar_url: string | null;
};

type EditableLink = SocialLinkInput & { key: string };

type PageEditorProps = {
  profile: EditorProfile;
  links: { id: string; platform: Platform; label: string | null; url: string; is_active: boolean }[];
};

export function PageEditor({ profile, links: initialLinks }: PageEditorProps) {
  const [form, setForm] = useState({
    full_name: profile.full_name,
    profession: profile.profession ?? "",
    registration: profile.registration ?? "",
    bio: profile.bio ?? "",
    whatsapp: profile.whatsapp ? formatPhone(profile.whatsapp) : "",
    timezone: profile.timezone,
    theme: profile.theme,
  });
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>();
  const [savingProfile, startProfile] = useTransition();

  const [links, setLinks] = useState<EditableLink[]>(
    initialLinks.map((l) => ({ ...l, label: l.label ?? "", key: l.id })),
  );
  const [savingLinks, startLinks] = useTransition();

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [avatarBusy, startAvatar] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const theme = THEMES[form.theme as ThemeKey] ?? THEMES.default;

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    startProfile(async () => {
      const result = await updateProfile(form);
      if (result.ok) {
        setErrors(undefined);
        toast.success("Página salva");
      } else {
        setErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  }

  function updateLink(key: string, patch: Partial<EditableLink>) {
    setLinks((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function moveLink(index: number, delta: number) {
    setLinks((ls) => {
      const next = [...ls];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });
  }

  function persistLinks() {
    startLinks(async () => {
      const result = await saveSocialLinks(
        links.map((l) => ({ id: l.id, platform: l.platform, label: l.label, url: l.url, is_active: l.is_active })),
      );
      if (result.ok) toast.success("Redes sociais salvas");
      else toast.error(result.error);
    });
  }

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem precisa ter no máximo 2 MB");
      return;
    }
    const data = new FormData();
    data.set("avatar", file);
    startAvatar(async () => {
      const result = await uploadAvatar(data);
      if (result.ok) {
        setAvatarUrl(result.data.url);
        toast.success("Foto atualizada");
      } else {
        toast.error(result.error);
      }
    });
  }

  function onRemoveAvatar() {
    startAvatar(async () => {
      const result = await removeAvatar();
      if (result.ok) setAvatarUrl(null);
      else toast.error(result.error);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Foto</CardTitle>
            <CardDescription>PNG, JPG ou WEBP de até 2 MB.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={onAvatarChange}
              aria-label="Escolher foto"
            />
            <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={avatarBusy}>
              {avatarBusy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
              {avatarUrl ? "Trocar foto" : "Enviar foto"}
            </Button>
            {avatarUrl && (
              <Button type="button" variant="ghost" onClick={onRemoveAvatar} disabled={avatarBusy}>
                Remover
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados da página</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="grid gap-4">
              <FormField
                label="Nome"
                name="full_name"
                required
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                errors={errors?.full_name}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Profissão"
                  name="profession"
                  value={form.profession}
                  onChange={(e) => set("profession", e.target.value)}
                  errors={errors?.profession}
                />
                <FormField
                  label="Registro (CRM, CRP...)"
                  name="registration"
                  value={form.registration}
                  onChange={(e) => set("registration", e.target.value)}
                  errors={errors?.registration}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  maxLength={500}
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  aria-describedby="bio-count"
                />
                <p id="bio-count" className="text-right text-xs text-muted-foreground">
                  {form.bio.length}/500
                </p>
              </div>
              <FormField
                label="WhatsApp"
                name="whatsapp"
                type="tel"
                inputMode="tel"
                placeholder="(85) 99999-0000"
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", formatPhone(e.target.value))}
                errors={errors?.whatsapp}
              />
              <div className="grid gap-2">
                <Label htmlFor="timezone">Fuso horário da agenda</Label>
                <NativeSelect
                  id="timezone"
                  className="w-full"
                  value={form.timezone}
                  onChange={(e) => set("timezone", e.target.value)}
                >
                  {!TIMEZONES.some(([tz]) => tz === form.timezone) && (
                    <NativeSelectOption value={form.timezone}>{form.timezone}</NativeSelectOption>
                  )}
                  {TIMEZONES.map(([tz, label]) => (
                    <NativeSelectOption key={tz} value={tz}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              <fieldset className="grid gap-2">
                <legend className="mb-2 text-sm font-medium">Tema</legend>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
                    <label
                      key={key}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                        form.theme === key && "border-primary ring-1 ring-primary",
                      )}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={key}
                        checked={form.theme === key}
                        onChange={() => set("theme", key)}
                        className="sr-only"
                      />
                      <span
                        className="size-4 rounded-full border"
                        style={{ background: THEMES[key].og.accent }}
                        aria-hidden="true"
                      />
                      {THEMES[key].label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <Button type="submit" disabled={savingProfile} className="justify-self-start">
                {savingProfile && <Loader2 className="animate-spin" aria-hidden="true" />}
                Salvar dados
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Redes sociais e links</CardTitle>
            <CardDescription>Aparecem como cards na sua página, nesta ordem.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {links.length === 0 && <p className="text-sm text-muted-foreground">Nenhum link ainda.</p>}
            <ul className="grid gap-3">
              {links.map((link, i) => (
                <li key={link.key} className="grid gap-2 rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <NativeSelect
                      size="sm"
                      aria-label={`Rede do link ${i + 1}`}
                      value={link.platform}
                      onChange={(e) => updateLink(link.key, { platform: e.target.value as Platform })}
                    >
                      {PLATFORMS.map((p) => (
                        <NativeSelectOption key={p} value={p}>
                          {PLATFORM_INFO[p].label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <div className="ml-auto flex items-center gap-1">
                      <Switch
                        checked={link.is_active}
                        onCheckedChange={(v) => updateLink(link.key, { is_active: v })}
                        aria-label={`Mostrar link ${i + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={i === 0}
                        onClick={() => moveLink(i, -1)}
                        aria-label={`Subir link ${i + 1}`}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={i === links.length - 1}
                        onClick={() => moveLink(i, 1)}
                        aria-label={`Descer link ${i + 1}`}
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setLinks((ls) => ls.filter((l) => l.key !== link.key))}
                        aria-label={`Remover link ${i + 1}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      aria-label={`Endereço do link ${i + 1}`}
                      placeholder={PLATFORM_INFO[link.platform].placeholder}
                      value={link.url}
                      onChange={(e) => updateLink(link.key, { url: e.target.value })}
                    />
                    <Input
                      aria-label={`Texto do card ${i + 1}`}
                      placeholder={`Texto do card (padrão: ${PLATFORM_INFO[link.platform].label})`}
                      value={link.label ?? ""}
                      onChange={(e) => updateLink(link.key, { label: e.target.value })}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={links.length >= 20}
                onClick={() =>
                  setLinks((ls) => [
                    ...ls,
                    { key: crypto.randomUUID(), platform: "instagram", label: "", url: "", is_active: true },
                  ])
                }
              >
                <Plus aria-hidden="true" /> Adicionar link
              </Button>
              <Button type="button" onClick={persistLinks} disabled={savingLinks}>
                {savingLinks && <Loader2 className="animate-spin" aria-hidden="true" />}
                Salvar links
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start" aria-label="Pré-visualização">
        <p className="mb-2 text-sm font-medium text-muted-foreground">Pré-visualização</p>
        <div className="overflow-hidden rounded-[2rem] border-8 border-neutral-900 shadow-lg">
          <div className={cn("flex max-h-[38rem] min-h-[32rem] flex-col items-center gap-6 overflow-y-auto px-4 py-8", theme.page)}>
            <ProfileHeader
              fullName={form.full_name || "Seu nome"}
              profession={form.profession || null}
              registration={form.registration || null}
              bio={form.bio || null}
              avatarUrl={avatarUrl}
              mutedClassName={theme.muted}
            />
            <div className={cn("flex min-h-12 w-full items-center justify-center rounded-xl font-semibold", theme.button)}>
              Agendar
            </div>
            <div className="flex w-full flex-col gap-3">
              {links
                .filter((l) => l.is_active)
                .map((l) => (
                  <SocialCard key={l.key} platform={l.platform} label={l.label ?? null} url={l.url} className={theme.card} />
                ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
