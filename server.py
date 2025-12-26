from http.server import SimpleHTTPRequestHandler
from socketserver import TCPServer
import json, os, cgi

PORT = 8000

CHAR_DIR = "chaos/data/characters"
IMG_CARD_DIR = "chaos/img/cards"
IMG_EPI_DIR = "chaos/img/epiphanies"

os.makedirs(CHAR_DIR, exist_ok=True)
os.makedirs(IMG_CARD_DIR, exist_ok=True)
os.makedirs(IMG_EPI_DIR, exist_ok=True)


def iter_files(form, key):
    field = form[key]
    if isinstance(field, list):
        return field
    return [field]


class Handler(SimpleHTTPRequestHandler):

    # =========================
    # POST ROUTER
    # =========================
    def do_POST(self):
        if self.path == "/save-character":
            self.save_character_full()
            return

        self.send_error(404)

    # =========================
    # SAVE / REPLACE CHARACTER
    # =========================
    def save_character_full(self):
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={
                "REQUEST_METHOD": "POST",
                "CONTENT_TYPE": self.headers["Content-Type"],
            }
        )

        # =========================
        # JSON
        # =========================
        if "json" not in form:
            self._error("Missing JSON payload")
            return

        try:
            character = json.loads(form["json"].value)
        except Exception:
            self._error("Invalid JSON")
            return

        # =========================
        # CODE PERSONAJE
        # =========================
        code = (
            character.get("code")
            or character.get("id")
            or form.getfirst("code")
        )

        if not code:
            self._error("Character code missing")
            return

        code = str(code)
        json_path = os.path.join(CHAR_DIR, f"{code}.json")

        # =========================
        # GUARDAR / REEMPLAZAR JSON
        # =========================
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(character, f, indent=2, ensure_ascii=False)

        # =========================
        # GUARDAR / REEMPLAZAR IMÁGENES
        # =========================
        for key in form:
            if not key.startswith("img_"):
                continue

            for file in iter_files(form, key):
                if not file.filename:
                    continue

                if not file.filename.lower().endswith(".png"):
                    continue

                dest = (
                    IMG_EPI_DIR
                    if "_epi_" in file.filename
                    else IMG_CARD_DIR
                )

                path = os.path.join(dest, file.filename)

                # 🔁 reemplazo directo
                with open(path, "wb") as f:
                    f.write(file.file.read())

        self._ok()

    # =========================
    # RESPUESTAS
    # =========================
    def _ok(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(
            b'{"status":"ok","mode":"replace"}'
        )

    def _error(self, msg):
        self.send_response(400)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(
            json.dumps({"error": msg}).encode("utf-8")
        )


with TCPServer(("", PORT), Handler) as httpd:
    print(f"Servidor corriendo en http://localhost:{PORT}")
    httpd.serve_forever()