# Aulas de Matemática e Física

Materiais interativos de estudo, para abrir no navegador (celular ou computador), sem instalar nada.

**Acesse:** https://hiremar.github.io/aulas-matematica-fisica/

| Material | Público |
|---|---|
| [Trigonometria no triângulo retângulo](https://hiremar.github.io/aulas-matematica-fisica/trigonometria.html) | 1º ano do Ensino Médio |
| [Função quadrática](https://hiremar.github.io/aulas-matematica-fisica/funcao-quadratica.html) | 1º ano do Ensino Médio |

Cada material tem **Teoria** interativa, um **Jogo**, **Exercícios** sorteados na hora (com justificativa de cada resposta) e **Meu relatório**, que o aluno salva em PDF ou copia para enviar ao professor. As respostas ficam guardadas só no aparelho do aluno.

---

### Para quem vai editar

Cada página é um arquivo HTML completo, gerado a partir da pasta `fonte/`:

- `fonte/comum.css` e `fonte/comum.js`: visual, abas, motor das questões e relatório (iguais em todas as páginas);
- `fonte/figuras.js`: desenho do triângulo e da parábola;
- `fonte/*.src.html`: o conteúdo de cada página;
- `fonte/build.py`: junta tudo (`python3 fonte/build.py`).

Elaborado por Hiremar Soares.
