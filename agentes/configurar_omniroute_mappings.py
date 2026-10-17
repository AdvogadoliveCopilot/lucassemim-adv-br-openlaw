r"""
Adiciona mapeamentos de modelos para combos na tabela model_combo_mappings.
"""
import sqlite3, datetime, os

DB_PATH = os.path.expanduser(r"~\.omniroute\storage.sqlite")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
now = datetime.datetime.now(datetime.timezone.utc).isoformat()

mappings = [
    ("map-best-fast", "auto/best-fast", "combo-best-fast", 100, 1, "Mapeamento auto/best-fast"),
    ("map-pro-chat", "auto/pro-chat", "combo-pro-chat", 100, 1, "Mapeamento auto/pro-chat"),
    ("map-smart", "auto/smart", "combo-smart", 100, 1, "Mapeamento auto/smart"),
    ("map-coding", "auto/coding", "combo-coding", 100, 1, "Mapeamento auto/coding"),
    ("map-legal", "auto/legal-writer", "combo-legal-writer", 100, 1, "Mapeamento auto/legal-writer"),
    ("map-free", "auto/free", "combo-free", 100, 1, "Mapeamento auto/free"),
]

for m_id, pat, c_id, prio, enb, desc in mappings:
    cursor.execute("SELECT id FROM model_combo_mappings WHERE pattern = ?", (pat,))
    if cursor.fetchone():
        cursor.execute("UPDATE model_combo_mappings SET combo_id = ?, priority = ?, enabled = ?, updated_at = ? WHERE pattern = ?",
                       (c_id, prio, enb, now, pat))
    else:
        cursor.execute("INSERT INTO model_combo_mappings (id, pattern, combo_id, priority, enabled, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                       (m_id, pat, c_id, prio, enb, desc, now, now))

conn.commit()
conn.close()
print("Mapeamentos model_combo_mappings atualizados com sucesso!")
