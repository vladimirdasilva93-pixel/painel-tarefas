"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const categories = [
  { id: "pdv", label: "PDV (Caixas)", desc: "Atividades dos caixas e frente de loja." },
  { id: "impressoras", label: "Impressoras", desc: "Manutencao e ajustes de impressoes." },
  { id: "computadores", label: "Computadores da Gerencia", desc: "Equipamentos dos gerentes e setores." },
  { id: "chamados", label: "Chamados", desc: "Pendencias gerais e suporte." }
];

const statusOptions = [
  { id: "pendente", label: "Pendente" },
  { id: "em_trabalho", label: "Em trabalho" },
  { id: "concluido", label: "Concluido" }
];

export default function PublicTasks() {
  const [tasks, setTasks] = useState([]);
  const [activeCategory, setActiveCategory] = useState("pdv");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const categoryMeta = useMemo(
    () => categories.find((item) => item.id === activeCategory),
    [activeCategory]
  );

  useEffect(() => {
    loadTasks();
  }, [activeCategory]);

  async function loadTasks() {
    setMessage("");
    const { data, error } = await supabase
      .from("tasks")
      .select("id, titulo, descricao, comentario, status, categoria, responsavel, fotos, created_at")
      .eq("categoria", activeCategory)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Nao foi possivel carregar as tarefas publicas.");
      return;
    }
    setTasks(data ?? []);
  }

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "todos" && task.status !== statusFilter) return false;
    if (query.trim()) {
      const term = query.trim().toLowerCase();
      return (
        String(task.titulo ?? "").toLowerCase().includes(term) ||
        String(task.descricao ?? "").toLowerCase().includes(term) ||
        String(task.comentario ?? "").toLowerCase().includes(term)
      );
    }
    return true;
  });

  function handleExport() {
    exportCsv(filteredTasks, categoryMeta?.label ?? "tarefas");
  }

  return (
    <main className="public-page">
      <header className="public-hero">
        <div>
          <span className="public-badge">Consulta publica</span>
          <div className="public-title">
            <img src="/vl-logo.png" alt="VL Tecnologia" />
            <h1>Painel de Tarefas</h1>
          </div>
          <p className="muted">Visualize as atividades registradas da loja.</p>
        </div>
        <a className="button admin-link" href="/admin">Acesso Administrativo</a>
      </header>

      <section className="public-grid">
        <aside className="public-sidebar">
          <h3>Categorias</h3>
          <div className="menu">
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === activeCategory ? "menu-item active" : "menu-item"}
                onClick={() => setActiveCategory(item.id)}
              >
                <span>{item.label}</span>
                <small>{item.desc}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="public-content">
          <div className="content-header">
            <div>
              <h2>{categoryMeta?.label}</h2>
              <p className="muted">{categoryMeta?.desc}</p>
            </div>
            <div className="filters">
              <input
                className="input"
                placeholder="Buscar tarefa..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select
                className="select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="todos">Todos os status</option>
                {statusOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button className="button ghost" type="button" onClick={handleExport}>
                Exportar Excel
              </button>
            </div>
          </div>

          <section className="card">
            <div className="list-header">
              <h3>Tarefas registradas</h3>
              <span className="muted">{filteredTasks.length} item(ns)</span>
            </div>
            {message && <p className="muted">{message}</p>}
            {filteredTasks.length === 0 && !message && (
              <p className="muted">Nenhuma tarefa encontrada para esta categoria.</p>
            )}
            <div className="task-list">
              {filteredTasks.map((task) => (
                <article key={task.id} className="task-card">
                  <div className="task-head">
                    <div>
                      <h4>{task.titulo}</h4>
                      <p className="muted">Criado em {formatDate(task.created_at)}</p>
                    </div>
                    <span className={`status ${task.status}`}>
                      {statusOptions.find((opt) => opt.id === task.status)?.label ?? "Status"}
                    </span>
                  </div>
                {task.descricao && <p>{task.descricao}</p>}
                {task.responsavel && (
                  <p className="comment">
                    <strong>Responsavel:</strong> {task.responsavel}
                  </p>
                )}
                {task.comentario && (
                  <p className="comment">
                    <strong>Comentario:</strong> {task.comentario}
                  </p>
                )}
                  {Array.isArray(task.fotos) && task.fotos.length > 0 && (
                    <div className="photo-grid">
                      {task.fotos.map((url, index) => (
                        <img key={`${task.id}-foto-${index}`} src={url} alt="Foto da tarefa" />
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </section>
      </section>

      <footer className="site-footer">
        <span>Marca registrada VL Tecnologia.</span>
        <a className="footer-link" href="mailto:vladimirdasilva93@gmail.com">
          Contato: vladimirdasilva93@gmail.com
        </a>
      </footer>
    </main>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function exportCsv(rows, label) {
  const header = [
    "Categoria",
    "Titulo",
    "Descricao",
    "Responsavel",
    "Comentario",
    "Status",
    "Criado em"
  ];
  const lines = rows.map((row) => [
    categoryLabel(row.categoria),
    String(row.titulo ?? ""),
    String(row.descricao ?? ""),
    String(row.responsavel ?? ""),
    String(row.comentario ?? ""),
    statusLabel(row.status),
    formatDate(row.created_at)
  ]);

  const csv = [header, ...lines]
    .map((cols) => cols.map(escapeCsv).join(";"))
    .join("\n");

  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeLabel = String(label ?? "tarefas")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  link.href = url;
  link.download = `tarefas-${safeLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (text.includes(";") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function categoryLabel(value) {
  return categories.find((item) => item.id === value)?.label ?? String(value ?? "");
}

function statusLabel(value) {
  return statusOptions.find((item) => item.id === value)?.label ?? String(value ?? "");
}
