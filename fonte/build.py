# Junta o CSS e o JS comuns dentro de cada página.
# Assim cada HTML fica completo num arquivo só (abre em qualquer celular, sem depender de outros arquivos).
# Uso:  python3 fonte/build.py
import pathlib

fonte = pathlib.Path(__file__).resolve().parent      # pasta "fonte"
saida = fonte.parent                                  # raiz do repositório (onde o GitHub Pages publica)

css = (fonte / "comum.css").read_text(encoding="utf-8")
js = (fonte / "comum.js").read_text(encoding="utf-8") + "\n" + (fonte / "figuras.js").read_text(encoding="utf-8")

for arquivo in sorted(fonte.glob("*.src.html")):
    html = arquivo.read_text(encoding="utf-8").replace("/*CSS*/", css).replace("/*JS*/", js)
    destino = saida / arquivo.name.replace(".src", "")
    destino.write_text(html, encoding="utf-8")
    print("gerado:", destino.name)
