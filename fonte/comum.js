/* =========================================================
   Funções comuns: números, frações, abas, questões e relatório
   ========================================================= */
const U = {
  // número inteiro aleatório entre a e b (inclusive)
  rand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
  pick(lista) { return lista[Math.floor(Math.random() * lista.length)]; },
  shuffle(lista) {
    const v = lista.slice();
    for (let i = v.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [v[i], v[j]] = [v[j], v[i]]; }
    return v;
  },
  mdc(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; },

  // número no formato brasileiro: vírgula decimal e sinal de menos tipográfico
  num(x, casas = 2) {
    if (Math.abs(x) < 1e-9) x = 0;
    let s = (Math.round(x * 10 ** casas) / 10 ** casas).toString();
    return s.replace("-", "−").replace(".", ",");
  },
  // fração em HTML; simplifica e vira inteiro quando der
  fr(n, d, simplificar = true) {
    if (d < 0) { n = -n; d = -d; }
    if (simplificar) { const g = U.mdc(n, d); n /= g; d /= g; }
    if (d === 1) return U.num(n);
    const sinal = n < 0 ? "−" : "";
    return `${sinal}<span class="fr"><span>${Math.abs(n)}</span><span>${d}</span></span>`;
  },
  // fração com conteúdo livre em cima e embaixo (ex.: "√3" sobre "2")
  frx(cima, baixo) { return `<span class="fr"><span>${cima}</span><span>${baixo}</span></span>`; },
  // coeficiente × √r  (r = 1, 2 ou 3), ex.: raiz(5,3) = "5√3"
  raiz(coef, r) {
    if (r === 1) return U.num(coef);
    if (coef === 1) return `√${r}`;
    if (coef === -1) return `−√${r}`;
    return `${U.num(coef)}√${r}`;
  },
  // escreve o polinômio ax² + bx + c bonitinho
  poli(a, b, c, nome = "f(x)") {
    const termos = [];
    const termo = (k, x) => {
      if (Math.abs(k) < 1e-9) return;
      const neg = k < 0, v = Math.abs(k);
      const coef = (v === 1 && x) ? "" : U.num(v);
      termos.push({ neg, txt: coef + x });
    };
    termo(a, "x²"); termo(b, "x"); termo(c, "");
    if (!termos.length) return `${nome} = 0`;
    let s = (termos[0].neg ? "−" : "") + termos[0].txt;
    for (const t of termos.slice(1)) s += (t.neg ? " − " : " + ") + t.txt;
    return nome ? `${nome} = ${s}` : s;
  },
  texto(html) { const d = document.createElement("div"); d.innerHTML = html; return d.textContent.replace(/\s+/g, " ").trim(); },
};

/* ---------- abas ---------- */
function iniciarAbas() {
  const abas = [...document.querySelectorAll(".aba")];
  const mostrar = (id) => {
    abas.forEach((b) => b.setAttribute("aria-selected", b.dataset.aba === id ? "true" : "false"));
    document.querySelectorAll(".painel").forEach((p) => { p.hidden = p.id !== id; });
    document.dispatchEvent(new CustomEvent("aba", { detail: id }));
    try { history.replaceState(null, "", "#" + id); } catch (e) {}
  };
  abas.forEach((b) => b.addEventListener("click", () => { mostrar(b.dataset.aba); window.scrollTo({ top: 0 }); }));
  const inicial = location.hash.slice(1);
  mostrar(abas.some((b) => b.dataset.aba === inicial) ? inicial : abas[0].dataset.aba);
}

/* ---------- histórico (fica salvo no próprio celular/computador) ---------- */
const Hist = {
  CHAVE: "aulasMF_historico",
  itens: [],
  nome: "",
  carregar() {
    try {
      const d = JSON.parse(localStorage.getItem(this.CHAVE) || "{}");
      this.itens = d.itens || []; this.nome = d.nome || "";
    } catch (e) {}
  },
  salvar() { try { localStorage.setItem(this.CHAVE, JSON.stringify({ itens: this.itens.slice(-300), nome: this.nome })); } catch (e) {} },
  add(item) { this.itens.push(item); this.salvar(); document.dispatchEvent(new Event("hist")); },
};
Hist.carregar();

/* ---------- motor das questões ---------- */
/* Cada gerador devolve:
   { tema, enun (html), fig (svg ou ""), certa (html), erradas: [{html, porque}], resol (html) } */
function criarQuiz({ raiz, modulo, geradores }) {
  const chaves = Object.keys(geradores);
  let ativos = new Set(chaves);
  let acertos = 0, total = 0, seq = 0;

  raiz.innerHTML = `
    <div class="filtros nao-imprimir" aria-label="Escolha os assuntos">
      ${chaves.map((k) => `<label><input type="checkbox" value="${k}" checked> ${geradores[k].nome}</label>`).join("")}
    </div>
    <div class="placar"><span>Acertos: <b class="q-ac">0</b> de <b class="q-to">0</b></span><span>Sequência: <b class="q-seq">0</b> 🔥</span></div>
    <div class="questao" aria-live="polite"></div>
    <div class="linha-btn"><button class="btn q-prox">Próxima questão</button></div>`;
  const caixa = raiz.querySelector(".questao");

  raiz.querySelectorAll(".filtros input").forEach((cb) => cb.addEventListener("change", () => {
    if (cb.checked) ativos.add(cb.value); else ativos.delete(cb.value);
    if (!ativos.size) { ativos.add(cb.value); cb.checked = true; }
    nova();
  }));
  raiz.querySelector(".q-prox").addEventListener("click", () => { nova(); caixa.scrollIntoView({ block: "nearest" }); });

  function nova() {
    const k = U.pick([...ativos]);
    const q = geradores[k].gerar();
    // remove alternativas repetidas (iguais à certa ou entre si)
    const vistos = new Set([U.texto(q.certa)]);
    const erradas = [];
    for (const e of U.shuffle(q.erradas)) {
      const t = U.texto(e.html);
      if (!vistos.has(t)) { vistos.add(t); erradas.push(e); }
      if (erradas.length === 3) break;
    }
    const ops = U.shuffle([{ html: q.certa, certa: true }, ...erradas]);
    caixa.innerHTML = `
      <p class="tema">${geradores[k].nome}</p>
      <div class="enun">${q.enun}</div>
      ${q.fig ? `<div class="figura">${q.fig}</div>` : ""}
      <div class="opcoes">${ops.map((o, i) => `<button class="opcao" data-i="${i}"><span class="letra">${"ABCD"[i]}</span><span>${o.html}</span></button>`).join("")}</div>
      <div class="resolucao" hidden></div>`;
    caixa.querySelectorAll(".opcao").forEach((b) => b.addEventListener("click", () => responder(q, ops, +b.dataset.i, geradores[k].nome)));
  }

  function responder(q, ops, i, tema) {
    const botoes = caixa.querySelectorAll(".opcao");
    botoes.forEach((b, j) => { b.disabled = true; if (ops[j].certa) b.classList.add("certa"); });
    const ok = ops[i].certa;
    if (!ok) botoes[i].classList.add("errada");
    total++; if (ok) { acertos++; seq++; } else seq = 0;
    raiz.querySelector(".q-ac").textContent = acertos;
    raiz.querySelector(".q-to").textContent = total;
    raiz.querySelector(".q-seq").textContent = seq;
    const r = caixa.querySelector(".resolucao");
    r.hidden = false;
    r.innerHTML = `
      <p class="veredito ${ok ? "ok" : "nok"}">${ok ? "✔ Certo!" : "✘ Não foi dessa vez."} Veja a justificativa:</p>
      ${!ok && ops[i].porque ? `<div class="porque"><b>Por que a sua resposta não serve:</b> ${ops[i].porque}</div>` : ""}
      <div>${q.resol}</div>`;
    Hist.add({ modulo, tema, enun: q.enun, fig: q.fig || "", escolhida: ops[i].html, certa: q.certa, ok, resol: q.resol, porque: ok ? "" : (ops[i].porque || ""), hora: Date.now() });
  }

  nova();
  return { nova };
}

/* ---------- relatório ---------- */
function iniciarRelatorio(raiz) {
  raiz.innerHTML = `
    <h2>Meu relatório</h2>
    <p>Tudo o que você respondeu nos exercícios fica guardado aqui, <b>neste aparelho</b>. Coloque seu nome e salve em PDF ou copie o resumo para enviar ao professor.</p>
    <div class="linha-btn nao-imprimir">
      <input class="nome-aluno" type="text" placeholder="Seu nome e turma" aria-label="Seu nome e turma">
    </div>
    <div class="linha-btn nao-imprimir">
      <button class="btn r-pdf">Salvar em PDF</button>
      <button class="btn claro r-copiar">Copiar resumo</button>
      <button class="btn claro r-apagar">Apagar histórico</button>
    </div>
    <p class="r-aviso nota" aria-live="polite"></p>
    <div class="r-cab"></div>
    <div class="r-lista"></div>`;
  const nome = raiz.querySelector(".nome-aluno");
  nome.value = Hist.nome;
  nome.addEventListener("input", () => { Hist.nome = nome.value; Hist.salvar(); desenhar(); });
  const aviso = raiz.querySelector(".r-aviso");

  function porTema() {
    const m = {};
    for (const it of Hist.itens) {
      const k = it.modulo + " — " + it.tema;
      m[k] = m[k] || { ac: 0, to: 0 }; m[k].to++; if (it.ok) m[k].ac++;
    }
    return m;
  }
  function desenhar() {
    const tot = Hist.itens.length, ac = Hist.itens.filter((i) => i.ok).length;
    const m = porTema();
    raiz.querySelector(".r-cab").innerHTML = `
      <h3>${Hist.nome ? Hist.nome : "Aluno(a) sem nome"} — ${ac} ${ac === 1 ? "acerto" : "acertos"} em ${tot} ${tot === 1 ? "questão" : "questões"}${tot ? ` (${Math.round(100 * ac / tot)}%)` : ""}</h3>
      ${tot ? `<div class="rolar"><table class="tab"><tr><th>Assunto</th><th>Acertos</th><th>Questões</th></tr>
        ${Object.entries(m).map(([k, v]) => `<tr><td style="text-align:left">${k}</td><td>${v.ac}</td><td>${v.to}</td></tr>`).join("")}</table></div>` : ""}`;
    raiz.querySelector(".r-lista").innerHTML = tot ? Hist.itens.slice().reverse().map((it, n) => `
      <div class="rel-item">
        <div><span class="st ${it.ok ? "ok" : "nok"}">${it.ok ? "✔ Acertou" : "✘ Errou"}</span> · ${it.modulo} — ${it.tema} · <small>${new Date(it.hora).toLocaleString("pt-BR")}</small></div>
        <div>${it.enun}</div>
        <details><summary>Ver resposta e justificativa</summary>
          ${it.fig ? `<div class="figura" style="max-width:420px">${it.fig}</div>` : ""}
          <p><b>Resposta marcada:</b> ${it.escolhida}<br><b>Resposta certa:</b> ${it.certa}</p>
          ${it.porque ? `<p><b>Por que a marcada não serve:</b> ${it.porque}</p>` : ""}
          <div>${it.resol}</div>
        </details>
      </div>`).join("") : `<p>Você ainda não respondeu nenhum exercício. Vá até a aba <b>Exercícios</b> e comece!</p>`;
  }
  raiz.querySelector(".r-pdf").addEventListener("click", () => {
    document.querySelectorAll(".painel").forEach((p) => p.classList.remove("imprimir"));
    raiz.closest(".painel").classList.add("imprimir");
    raiz.querySelectorAll("details").forEach((d) => (d.open = true));
    window.print();
  });
  raiz.querySelector(".r-copiar").addEventListener("click", async () => {
    const tot = Hist.itens.length, ac = Hist.itens.filter((i) => i.ok).length;
    const linhas = [`Relatório — ${Hist.nome || "sem nome"}`, `${ac} acertos em ${tot} questões`,
      ...Object.entries(porTema()).map(([k, v]) => `• ${k}: ${v.ac}/${v.to}`)];
    const txt = linhas.join("\n");
    try { await navigator.clipboard.writeText(txt); aviso.textContent = "Resumo copiado! Agora é só colar na mensagem para o professor."; }
    catch (e) { aviso.textContent = txt; }
  });
  let confirmar = false;
  const bApagar = raiz.querySelector(".r-apagar");
  bApagar.addEventListener("click", () => {
    if (!confirmar) { confirmar = true; bApagar.textContent = "Toque de novo para apagar tudo"; setTimeout(() => { confirmar = false; bApagar.textContent = "Apagar histórico"; }, 4000); return; }
    Hist.itens = []; Hist.salvar(); confirmar = false; bApagar.textContent = "Apagar histórico"; desenhar();
  });
  document.addEventListener("hist", desenhar);
  window.addEventListener("afterprint", () => document.querySelectorAll(".painel").forEach((p) => p.classList.remove("imprimir")));
  desenhar();
}
