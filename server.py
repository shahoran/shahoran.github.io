from http.server import SimpleHTTPRequestHandler
from socketserver import TCPServer
import json, os, cgi

PORT = 8000

CHAR_DIR = "chaos/data/characters"
IMG_DIR = "chaos/img/cards"

os.makedirs(CHAR_DIR, exist_ok=True)
os.makedirs(IMG_DIR, exist_ok=True)

class Handler(SimpleHTTPRequestHandler):

    # =========================
    # POST ROUTER
    # =========================
    def do_POST(self):
        if self.path == "/save-character":
            self.save_character()
            return

        if self.path == "/save-epiphanies-images":
            self.save_epiphanies_images()
            return

        self.send_error(404)

    # =========================
    # SAVE CHARACTER (ORIGINAL)
    # =========================
    def save_character(self):
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={
                "REQUEST_METHOD": "POST",
                "CONTENT_TYPE": self.headers["Content-Type"],
            }
        )

        character = json.loads(form["json"].value)
        code = str(character["id"])

        json_path = os.path.join(CHAR_DIR, f"{code}.json")

        # 🔒 no sobrescribir
        if os.path.exists(json_path):
            self._error(f"Character {code}.json already exists")
            return

        # 🔒 validar colisión de imágenes
        for key in form:
            if key.startswith("img_"):
                file = form[key]
                if file.filename:
                    img_path = os.path.join(IMG_DIR, file.filename)
                    if os.path.exists(img_path):
                        self._error(f"Image already exists: {file.filename}")
                        return

        # 📄 guardar JSON
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(character, f, indent=2, ensure_ascii=False)

        # 🖼️ guardar imágenes
        for key in form:
            if key.startswith("img_"):
                file = form[key]
                if file.filename:
                    with open(
                        os.path.join(IMG_DIR, file.filename),
                        "wb"
                    ) as f:
                        f.write(file.file.read())

        self._ok()

    # =========================
    # SAVE EPIPHANIES IMAGES
    # =========================
    def save_epiphanies_images(self):
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={
                "REQUEST_METHOD": "POST",
                "CONTENT_TYPE": self.headers["Content-Type"],
            }
        )

        saved = []
        skipped = []

        for key in form:
            if not key.startswith("img_"):
                continue

            file = form[key]
            if not file.filename:
                continue

            # solo png
            if not file.filename.lower().endswith(".png"):
                skipped.append(file.filename)
                continue

            img_path = os.path.join(IMG_DIR, file.filename)

            # 🔒 no sobrescribir
            if os.path.exists(img_path):
                skipped.append(file.filename)
                continue

            with open(img_path, "wb") as f:
                f.write(file.file.read())

            saved.append(file.filename)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(
            json.dumps({
                "status": "ok",
                "saved": saved,
                "skipped": skipped
            }).encode("utf-8")
        )

    # =========================
    # RESPUESTAS
    # =========================
    def _ok(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"ok"}')

    def _error(self, msg):
        self.send_response(409)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(
            json.dumps({"error": msg}).encode("utf-8")
        )


with TCPServer(("", PORT), Handler) as httpd:
    print(f"Servidor corriendo en http://localhost:{PORT}")
    httpd.serve_forever()