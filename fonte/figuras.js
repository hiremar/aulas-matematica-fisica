/* =========================================================
   Desenhos em SVG usados nas páginas
   ========================================================= */
const COR = {
  tinta: "#1d3557", tinta2: "#4a6283", grade: "#d6e4f2",
  rosa: "#ff8cc6", verde: "#6fdc8c", amarelo: "#ffe14d", azul: "#8cc8ff", vermelho: "#e05561",
};

/* Triângulo retângulo.
   co = cateto oposto ao ângulo marcado, ca = cateto adjacente.
   O ângulo reto fica no vértice C; o ângulo marcado no vértice A.
   Opções: rot (graus), flip, cores (marca-texto), clicavel, lab {opo, adj, hip}, ang (texto do ângulo) */
function triangulo(o) {
  const W = o.W || 420, H = o.H || 250, p = o.pad || 44;
  const pts = { A: [0, 0], C: [o.ca, 0], B: [o.ca, o.co] };
  const r = ((o.rot || 0) * Math.PI) / 180;
  for (const k in pts) {
    let [x, y] = pts[k];
    if (o.flip) x = -x;
    pts[k] = [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
  }
  const xs = Object.values(pts).map((v) => v[0]), ys = Object.values(pts).map((v) => v[1]);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  const s = Math.min((W - 2 * p) / (maxx - minx || 1), (H - 2 * p) / (maxy - miny || 1));
  const ox = (W - (maxx - minx) * s) / 2, oy = (H - (maxy - miny) * s) / 2;
  const P = {};
  for (const k in pts) P[k] = [ox + (pts[k][0] - minx) * s, H - (oy + (pts[k][1] - miny) * s)];

  const ref = o.ref || "A";                       // vértice do ângulo de referência
  const lados = { hip: ["A", "B"], opo: ref === "A" ? ["B", "C"] : ["A", "C"], adj: ref === "A" ? ["A", "C"] : ["B", "C"] };
  const corLado = { hip: COR.amarelo, opo: COR.rosa, adj: COR.verde };
  const f = (n) => n.toFixed(1);
  let svg = "";

  // marca-texto por baixo da tinta
  for (const k of ["hip", "opo", "adj"]) {
    const [a, b] = lados[k];
    const ligado = o.cores === true || (Array.isArray(o.cores) && o.cores.includes(k));
    if (ligado) svg += `<line x1="${f(P[a][0])}" y1="${f(P[a][1])}" x2="${f(P[b][0])}" y2="${f(P[b][1])}" stroke="${corLado[k]}" stroke-width="13" stroke-linecap="round" opacity="0.9"/>`;
  }
  // os três lados
  svg += `<polygon points="${["A", "B", "C"].map((k) => P[k].map(f).join(",")).join(" ")}" fill="rgba(255,255,255,0.55)" stroke="${COR.tinta}" stroke-width="2.6" stroke-linejoin="round"/>`;
  // ângulo reto em C
  const unit = (a, b, t) => { const dx = P[b][0] - P[a][0], dy = P[b][1] - P[a][1], L = Math.hypot(dx, dy); return [(dx / L) * t, (dy / L) * t]; };
  const u = unit("C", "A", 15), v = unit("C", "B", 15);
  svg += `<path d="M${f(P.C[0] + u[0])},${f(P.C[1] + u[1])} L${f(P.C[0] + u[0] + v[0])},${f(P.C[1] + u[1] + v[1])} L${f(P.C[0] + v[0])},${f(P.C[1] + v[1])}" fill="none" stroke="${COR.tinta}" stroke-width="1.8"/>`;
  // arco do ângulo marcado
  const V = P[ref], n1 = P.C, n2 = ref === "A" ? P.B : P.A;
  const a1 = Math.atan2(n1[1] - V[1], n1[0] - V[0]);
  let d = Math.atan2(n2[1] - V[1], n2[0] - V[0]) - a1;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  const R = 30, a2 = a1 + d;
  svg += `<path d="M${f(V[0] + R * Math.cos(a1))},${f(V[1] + R * Math.sin(a1))} A${R},${R} 0 0 ${d > 0 ? 1 : 0} ${f(V[0] + R * Math.cos(a2))},${f(V[1] + R * Math.sin(a2))}" fill="none" stroke="${COR.vermelho}" stroke-width="2.4"/>`;
  const am = a1 + d / 2, ra = R + 14 + Math.max(0, String(o.ang || "α").length - 1) * 5.5;
  svg += `<text x="${f(V[0] + ra * Math.cos(am))}" y="${f(V[1] + ra * Math.sin(am) + 6)}" text-anchor="middle" font-family="Kalam, cursive" font-size="19" fill="${COR.vermelho}" font-weight="700">${o.ang || "α"}</text>`;
  // textos dos lados (afastados do centro do triângulo)
  const G = [(P.A[0] + P.B[0] + P.C[0]) / 3, (P.A[1] + P.B[1] + P.C[1]) / 3];
  const lab = o.lab || {};
  for (const k of ["hip", "opo", "adj"]) {
    if (lab[k] === undefined || lab[k] === "") continue;
    const [a, b] = lados[k];
    const M = [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2];
    let nx = M[0] - G[0], ny = M[1] - G[1]; const L = Math.hypot(nx, ny) || 1;
    const txt = String(lab[k]), dist = 20 + Math.max(0, txt.length - 3) * (k === "hip" ? 3.2 : 1.2);
    nx = (nx / L) * dist; ny = (ny / L) * dist;
    svg += `<text x="${f(M[0] + nx)}" y="${f(M[1] + ny + 6)}" text-anchor="middle" font-family="Kalam, cursive" font-size="19" fill="${COR.tinta}" stroke="#fff" stroke-width="4" paint-order="stroke" font-weight="700">${lab[k]}</text>`;
  }
  // áreas de toque (jogo)
  if (o.clicavel) {
    for (const k of ["hip", "opo", "adj"]) {
      const [a, b] = lados[k];
      svg += `<line class="alvo" data-lado="${k}" x1="${f(P[a][0])}" y1="${f(P[a][1])}" x2="${f(P[b][0])}" y2="${f(P[b][1])}" stroke="transparent" stroke-width="34" stroke-linecap="round" style="cursor:pointer"/>`;
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.desc || "Triângulo retângulo"}">${svg}</svg>`;
}

/* Gráfico de f(x) = ax² + bx + c sobre papel quadriculado.
   Opções: x0, x1, y0, y1 (janela), pontos (marcar raízes/vértice/eixo y), numeros (escala nos eixos) */
let _idGraf = 0;
function grafico(o) {
  const W = o.W || 420, H = o.H || 320;
  const x0 = o.x0 ?? -8, x1 = o.x1 ?? 8, y0 = o.y0 ?? -10, y1 = o.y1 ?? 10;
  const X = (x) => ((x - x0) / (x1 - x0)) * W, Y = (y) => H - ((y - y0) / (y1 - y0)) * H;
  const f = (x) => o.a * x * x + o.b * x + o.c, r = (n) => n.toFixed(1);
  const id = "cg" + ++_idGraf;
  let s = `<defs><clipPath id="${id}"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath></defs>`;
  // grade de 1 em 1
  for (let x = Math.ceil(x0); x <= x1; x++) s += `<line x1="${r(X(x))}" y1="0" x2="${r(X(x))}" y2="${H}" stroke="${COR.grade}" stroke-width="1"/>`;
  for (let y = Math.ceil(y0); y <= y1; y++) s += `<line x1="0" y1="${r(Y(y))}" x2="${W}" y2="${r(Y(y))}" stroke="${COR.grade}" stroke-width="1"/>`;
  // eixos
  s += `<line x1="0" y1="${r(Y(0))}" x2="${W}" y2="${r(Y(0))}" stroke="${COR.tinta2}" stroke-width="1.6"/>
        <line x1="${r(X(0))}" y1="0" x2="${r(X(0))}" y2="${H}" stroke="${COR.tinta2}" stroke-width="1.6"/>
        <text x="${W - 12}" y="${r(Y(0) - 6)}" font-size="13" fill="${COR.tinta2}" font-style="italic">x</text>
        <text x="${r(X(0) + 6)}" y="14" font-size="13" fill="${COR.tinta2}" font-style="italic">y</text>`;
  if (o.numeros !== false) {
    const passo = (x1 - x0) > 12 ? 2 : 1;
    for (let x = Math.ceil(x0 / passo) * passo; x < x1; x += passo) if (x !== 0) s += `<text x="${r(X(x))}" y="${r(Y(0) + 15)}" font-size="11" text-anchor="middle" fill="${COR.tinta2}">${String(x).replace("-", "−")}</text>`;
    const passoY = (y1 - y0) > 12 ? 2 : 1;
    for (let y = Math.ceil(y0 / passoY) * passoY; y < y1; y += passoY) if (y !== 0) s += `<text x="${r(X(0) - 5)}" y="${r(Y(y) + 4)}" font-size="11" text-anchor="end" fill="${COR.tinta2}">${String(y).replace("-", "−")}</text>`;
  }
  // a curva
  let d = "";
  for (let i = 0; i <= 240; i++) {
    const x = x0 + ((x1 - x0) * i) / 240;
    let y = f(x); y = Math.max(y0 - 50, Math.min(y1 + 50, y));
    d += (i ? "L" : "M") + r(X(x)) + "," + r(Y(y));
  }
  s += `<path d="${d}" fill="none" stroke="${COR.tinta}" stroke-width="3" clip-path="url(#${id})" stroke-linejoin="round"/>`;
  // pontos importantes
  const ponto = (x, y, cor, txt, dy = -12) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return "";
    return `<circle cx="${r(X(x))}" cy="${r(Y(y))}" r="9" fill="${cor}" opacity="0.9"/><circle cx="${r(X(x))}" cy="${r(Y(y))}" r="3.5" fill="${COR.tinta}"/>` +
      (txt ? `<text x="${r(X(x))}" y="${r(Y(y) + dy)}" text-anchor="middle" font-family="Kalam, cursive" font-size="15" font-weight="700" fill="${COR.tinta}" stroke="#fff" stroke-width="4" paint-order="stroke">${txt}</text>` : "");
  };
  if (o.pontos && o.a !== 0) {
    const D = o.b * o.b - 4 * o.a * o.c, xv = -o.b / (2 * o.a), yv = f(xv);
    const fmt = (n) => U.num(n, 2);
    s += ponto(0, o.c, COR.amarelo, "", 0);
    if (o.rotulos && o.c >= y0 && o.c <= y1) s += `<text x="${r(X(0) - 12)}" y="${r(Y(o.c) + 5)}" text-anchor="end" font-family="Kalam, cursive" font-size="15" font-weight="700" fill="${COR.tinta}" stroke="#fff" stroke-width="4" paint-order="stroke">(0, ${fmt(o.c)})</text>`;
    if (D >= 0) {
      const ra = (-o.b - Math.sqrt(D)) / (2 * o.a), rb = (-o.b + Math.sqrt(D)) / (2 * o.a);
      s += ponto(ra, 0, COR.rosa, o.rotulos ? fmt(ra) : "", o.a > 0 ? -12 : 22);
      if (D > 0) s += ponto(rb, 0, COR.rosa, o.rotulos ? fmt(rb) : "", o.a > 0 ? -12 : 22);
    }
    s += ponto(xv, yv, COR.verde, o.rotulos ? `V(${fmt(xv)}, ${fmt(yv)})` : "", o.a > 0 ? 24 : -14);
  }
  if (o.extra) s += o.extra(X, Y);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.desc || "Gráfico de uma função quadrática"}">${s}</svg>`;
}
