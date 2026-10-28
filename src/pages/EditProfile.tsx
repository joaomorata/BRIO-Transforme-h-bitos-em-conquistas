import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, User, Mail, FileText, Palette,
  Lock, CheckCircle2, AlertCircle, Camera, Loader2, X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/ui/UserAvatar";

const AVATAR_COLORS = [
  "#7c3aed", "#2563eb", "#0891b2", "#059669",
  "#d97706", "#dc2626", "#db2777", "#7c3aed",
  "#6366f1", "#0ea5e9",
];

type Tab = "info" | "password";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB — igual ao limite do bucket

export default function EditProfile() {
  const { user, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("info");

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    avatarColor: user?.avatarColor || "#7c3aed",
  });

  // Foto: assim como os outros campos, a troca/remoção só fica guardada aqui
  // (preview local, nada enviado ainda) até o usuário apertar "Salvar
  // alterações" — "Cancelar" só precisa sair da tela, sem desfazer nada no
  // servidor, porque nada foi lá ainda.
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const [pwForm, setPwForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Evita vazar memória com blob URLs de preview que nunca foram usadas (se o
  // usuário trocar de foto várias vezes antes de salvar, ou sair da tela).
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  // Apaga tudo que já existe na pasta do usuário (exceto, opcionalmente, um arquivo).
  const cleanupOldPhotos = async (keepPath?: string) => {
    if (!user) return;
    const { data: files } = await supabase.storage.from("avatars").list(user.id);
    const toRemove = (files ?? [])
      .map((f) => `${user.id}/${f.name}`)
      .filter((path) => path !== keepPath);
    if (toRemove.length > 0) await supabase.storage.from("avatars").remove(toRemove);
  };

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo depois
    if (!file) return;

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      setFeedback({ type: "err", msg: "Use uma imagem JPG, PNG ou WebP." });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setFeedback({ type: "err", msg: "A foto pode ter no máximo 2 MB." });
      return;
    }

    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPendingPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setRemovePhoto(false);
    setFeedback(null);
  };

  // Só marca a remoção como pendente — some da tela, mas só vira de verdade
  // no storage/perfil quando "Salvar alterações" for clicado.
  const handleStageRemovePhoto = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPendingPhotoFile(null);
    setPhotoPreviewUrl(null);
    setRemovePhoto(true);
    setFeedback(null);
  };

  const handleUndoPhotoChange = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPendingPhotoFile(null);
    setPhotoPreviewUrl(null);
    setRemovePhoto(false);
    setFeedback(null);
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFeedback({ type: "err", msg: "O nome não pode ser vazio." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    let avatarUrl: string | undefined; // undefined = não mexe na foto atual
    let uploadedPath: string | undefined;

    if (pendingPhotoFile && user) {
      const ext = ALLOWED_TYPES[pendingPhotoFile.type];
      // Nome único por upload evita o navegador mostrar a foto antiga em cache.
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, pendingPhotoFile, { contentType: pendingPhotoFile.type, upsert: false });

      if (uploadError) {
        setSaving(false);
        setFeedback({ type: "err", msg: "Não foi possível enviar a foto. Tente novamente." });
        return;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = urlData.publicUrl;
      uploadedPath = path;
    } else if (removePhoto) {
      avatarUrl = "";
    }

    const result = await updateProfile({
      name: form.name,
      email: form.email,
      bio: form.bio,
      avatarColor: form.avatarColor,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    });

    if (!result.success) {
      setSaving(false);
      setFeedback({ type: "err", msg: result.error || "Erro ao atualizar perfil." });
      return;
    }

    if (pendingPhotoFile || removePhoto) {
      await cleanupOldPhotos(uploadedPath);
    }

    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPendingPhotoFile(null);
    setPhotoPreviewUrl(null);
    setRemovePhoto(false);

    setSaving(false);
    setFeedback({ type: "ok", msg: "Perfil atualizado com sucesso!" });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCancel = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    navigate(-1);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next.length < 8) {
      setFeedback({ type: "err", msg: "A nova senha deve ter pelo menos 8 caracteres." });
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setFeedback({ type: "err", msg: "As senhas não coincidem." });
      return;
    }
    const result = await changePassword(pwForm.current, pwForm.next);
    if (result.success) {
      setFeedback({ type: "ok", msg: "Senha alterada com sucesso!" });
      setPwForm({ current: "", next: "", confirm: "" });
    } else {
      setFeedback({ type: "err", msg: result.error || "Erro ao alterar senha." });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  // Prioridade de exibição: foto nova escolhida > "sem foto" se marcada pra
  // remoção > foto que já está salva.
  const displayAvatarUrl = pendingPhotoFile ? photoPreviewUrl : (removePhoto ? null : user?.avatarUrl);
  const hasPendingPhotoChange = !!pendingPhotoFile || removePhoto;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">Editar Perfil</h1>
          <p className="text-xs text-muted-foreground">Atualize suas informações pessoais</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <UserAvatar
              url={displayAvatarUrl}
              color={form.avatarColor}
              name={form.name || user?.name}
              size={80}
              className="shadow-lg text-2xl"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              aria-label="Trocar foto de perfil"
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary hover:bg-primary/90 disabled:opacity-70 rounded-lg flex items-center justify-center border-2 border-card transition-colors"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoSelected}
              className="hidden"
            />
          </div>

          {hasPendingPhotoChange ? (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-primary">
                {pendingPhotoFile ? "Nova foto selecionada" : "Foto será removida"}
              </span>
              <button
                type="button"
                onClick={handleUndoPhotoChange}
                disabled={saving}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
              >
                <X className="w-3 h-3" /> Desfazer
              </button>
            </div>
          ) : user?.avatarUrl ? (
            <button
              type="button"
              onClick={handleStageRemovePhoto}
              disabled={saving}
              className="mt-3 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-60"
            >
              Remover foto
            </button>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">JPG, PNG ou WebP, até 2 MB</p>
          )}
        </div>

        <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6">
          {([["info", "Informações"], ["password", "Senha"]] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => { setTab(t); setFeedback(null); }}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4 text-sm border",
                feedback.type === "ok"
                  ? "bg-accent/10 border-accent/20 text-accent"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              )}
            >
              {feedback.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {feedback.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {tab === "info" && (
          <motion.form
            key="info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSaveInfo}
            className="space-y-4"
          >
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                <User className="w-3.5 h-3.5" /> Nome
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                <FileText className="w-3.5 h-3.5" /> Bio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                maxLength={160}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Fale um pouco sobre você..."
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-right">{form.bio.length}/160</p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                <Palette className="w-3.5 h-3.5" /> Cor do avatar
              </label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.slice(0, 9).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, avatarColor: color })}
                    className={cn(
                      "w-8 h-8 rounded-lg transition-all",
                      form.avatarColor === color && "ring-2 ring-white ring-offset-2 ring-offset-card scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 py-2.5 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-70 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </motion.form>
        )}

        {tab === "password" && (
          <motion.form
            key="password"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleChangePassword}
            className="space-y-4"
          >
            {[
              { label: "Senha atual", key: "current", placeholder: "Senha atual" },
              { label: "Nova senha", key: "next", placeholder: "Mínimo 8 caracteres" },
              { label: "Confirmar nova senha", key: "confirm", placeholder: "Repita a nova senha" },
            ].map((field) => (
              <div key={field.key}>
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                  <Lock className="w-3.5 h-3.5" /> {field.label}
                </label>
                <input
                  type="password"
                  placeholder={field.placeholder}
                  value={pwForm[field.key as keyof typeof pwForm]}
                  onChange={(e) => setPwForm({ ...pwForm, [field.key]: e.target.value })}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            ))}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Alterar senha
              </button>
            </div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}
