"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Pencil, Trash2, X, Check, Eye, EyeOff, ShieldCheck, ShieldAlert } from "lucide-react";
import { useSession } from "@/lib/session";
import { useAdminLanguage } from "@/lib/LanguageContext";

type Usuario = {
  id: number;
  username: string;
  email?: string;
  rol: "admin" | "editor" | "general";
  activo: boolean;
  createdAt: string;
};

const EMPTY = { username: "", email: "", password: "", rol: "editor" as "admin" | "editor" | "general" };

const ROL_STYLE: Record<string, { bg: string; color: string; label: string; icon: React.ElementType }> = {
  admin:   { bg: "rgba(252,165,165,0.1)", color: "#f87171",  label: "Admin",   icon: ShieldCheck },
  editor:  { bg: "rgba(201,168,76,0.1)",  color: "#c9a84c",  label: "Editor",  icon: ShieldAlert },
  general: { bg: "rgba(96,165,250,0.1)",  color: "#60a5fa",  label: "General", icon: ShieldCheck },
};

const INPUT: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 4, padding: "8px 12px", color: "#fff", fontSize: 14, boxSizing: "border-box",
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#0e0d0b", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, width: "100%", maxWidth: 480 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ padding: "1.5rem" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", marginBottom: "0.4rem" }}>{label}</label>
      {children}
    </div>
  );
}

export default function TrabajadoresPage() {
  const { tr } = useAdminLanguage();
  const a = tr.admin;
  const { role } = useSession();
  const isMainAdmin = role === "admin";
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/trabajadores");
      if (res.ok) {
        const data: Usuario[] = await res.json();
        // Ocultar solo el admin del sistema (.env), el resto sí aparece
        setUsuarios(data.filter(u => u.username !== "admin"));
      }
    } catch {
      // error de red — la lista queda vacía
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setError(""); setShowPass(false); setModal("add"); };
  const openEdit = (u: Usuario) => {
    setEditId(u.id);
    setForm({ username: u.username, email: u.email ?? "", password: "", rol: u.rol });
    setError(""); setShowPass(false); setModal("edit");
  };

  const handleSave = async () => {
    setError("");
    if (!form.username) return setError("El nombre de usuario es obligatorio.");
    if (!form.email) return setError("El email es obligatorio.");
    if (modal === "add" && !form.password) return setError("La contraseña es obligatoria al crear un usuario.");
    setSaving(true);
    try {
      const res = modal === "add"
        ? await fetch("/api/admin/trabajadores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        : await fetch(`/api/admin/trabajadores/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? `Error ${res.status} al guardar.`);
        return;
      }
      await load();
      setModal(null);
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (u: Usuario) => {
    await fetch(`/api/admin/trabajadores/${u.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activo: !u.activo }) });
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, activo: !u.activo } : x));
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/trabajadores/${id}`, { method: "DELETE" });
    setUsuarios(prev => prev.filter(u => u.id !== id));
    setDeleteId(null);
  };

  const f = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.5)", marginBottom: "0.25rem" }}>{a.gestion}</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-playfair, serif)", color: "#fff", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Users size={24} style={{ color: "#c9a84c" }} /> {a.trabajadores}
          </h1>
        </div>
        <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", background: "#c9a84c", border: "none", borderRadius: 4, color: "#0a0a0f", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={15} /> {a.añadirTrabajador}
        </button>
      </div>

      {/* Info */}
      <div style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 6, padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        {[
          { icon: ShieldAlert, label: "Editor", desc: a.editorDesc, color: "#c9a84c" },
          { icon: ShieldCheck, label: "General", desc: a.generalDesc, color: "#60a5fa" },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <Icon size={16} style={{ color, marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>{label}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Admin principal (solo lectura) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.12)", borderRadius: 6, marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ShieldCheck size={16} style={{ color: "#f87171", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>admin</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>{a.adminPrincipalDesc}</p>
          </div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, padding: "4px 13px", borderRadius: 999, background: "rgba(248,113,113,0.1)", color: "#f87171", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <ShieldCheck size={11} /> Admin
        </span>
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>{a.cargando}</p>
      ) : usuarios.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
          {a.noHayTrabajadores}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {usuarios.map(u => {
            const rol = ROL_STYLE[u.rol];
            const Icon = rol.icon;
            return (
              <div key={u.id} style={{
                display: "grid", gridTemplateColumns: "1fr auto auto auto auto",
                gap: "1rem", alignItems: "center",
                padding: "1rem 1.25rem",
                background: u.activo ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.01)",
                border: `1px solid ${u.activo ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)"}`,
                borderRadius: 6, opacity: u.activo ? 1 : 0.5,
              }}>
                {/* Info */}
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>{u.username}</p>
                  {u.email && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>{u.email}</p>}
                </div>

                {/* Rol */}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, padding: "4px 13px", borderRadius: 999, background: rol.bg, color: rol.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                  <Icon size={11} /> {rol.label}
                </span>

                {/* Estado */}
                <span style={{ fontSize: 12, padding: "4px 13px", borderRadius: 999, background: u.activo ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", color: u.activo ? "#4ade80" : "rgba(255,255,255,0.25)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer", whiteSpace: "nowrap" }}
                  onClick={() => toggleActivo(u)}>
                  {u.activo ? a.statusActivo : a.statusInactivo}
                </span>

                {/* Editar */}
                <button onClick={() => openEdit(u)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
                  <Pencil size={13} />
                </button>

                {/* Eliminar */}
                <button onClick={() => setDeleteId(u.id)} style={{ background: "rgba(252,165,165,0.06)", border: "1px solid rgba(252,165,165,0.12)", borderRadius: 4, padding: "6px 8px", cursor: "pointer", color: "rgba(252,165,165,0.6)" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <Modal title={modal === "add" ? a.añadirTrabajadorModal : a.editarTrabajadorModal} onClose={() => setModal(null)}>
          <Field label={a.nombreUsuario}>
            <input value={form.username} onChange={e => f("username", e.target.value)} style={INPUT} placeholder="nombre_usuario" />
          </Field>
          <Field label={a.emailField}>
            <input type="email" value={form.email} onChange={e => f("email", e.target.value)} style={INPUT} placeholder="correo@ejemplo.com" />
          </Field>
          <Field label={modal === "add" ? a.contrasena : a.nuevaContrasena}>
            <div style={{ position: "relative" }}>
              <input type={showPass ? "text" : "password"} value={form.password} onChange={e => f("password", e.target.value)} style={{ ...INPUT, paddingRight: "2.5rem" }} placeholder={modal === "edit" ? a.dejaVacioMantener : a.minimoCaracteres} />
              <button onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
          <Field label={a.rolField}>
            <div style={{ display: "flex", gap: 8 }}>
              {(isMainAdmin ? ["admin", "editor", "general"] : ["editor", "general"] as const).map(r => (
                <button key={r} onClick={() => f("rol", r)} style={{
                  flex: 1, padding: "8px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em",
                  background: form.rol === r ? ROL_STYLE[r].bg : "rgba(255,255,255,0.03)",
                  color: form.rol === r ? ROL_STYLE[r].color : "rgba(255,255,255,0.3)",
                  border: `1px solid ${form.rol === r ? ROL_STYLE[r].color : "rgba(255,255,255,0.08)"}`,
                }}>{r}</button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: "0.4rem" }}>
              {form.rol === "editor" ? a.editorRolDesc : a.generalRolDesc}
            </p>
          </Field>

          {error && <p style={{ fontSize: 13, color: "#fca5a5", marginBottom: "0.75rem" }}>{error}</p>}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}>{a.cancelar}</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "10px", border: "none", borderRadius: 4, background: "#c9a84c", color: "#0a0a0f", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: saving ? 0.6 : 1 }}>
              <Check size={14} />{saving ? a.guardando : a.guardar}
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm delete */}
      {deleteId && (
        <Modal title={a.confirmarEliminarTrabajador.split("?")[0]} onClose={() => setDeleteId(null)}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: "1.5rem" }}>{a.confirmarEliminarTrabajador}</p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "10px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}>{a.cancelar}</button>
            <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 4, background: "rgba(252,165,165,0.15)", color: "#fca5a5", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{a.eliminar}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
