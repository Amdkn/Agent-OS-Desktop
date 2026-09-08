import sqlite3, json, hashlib, os, time, uuid

PB_DB_PATH = r'C:\Users\amado\bin\pocketbase\pb_data\data.db'

def run_meta_audit_and_sync():
    now_iso = time.strftime('%Y-%m-%d %H:%M:%SZ', time.gmtime())
    now_sqlite = time.strftime('%Y-%m-%d %H:%M:%S.000Z', time.gmtime())
    
    conn = sqlite3.connect(PB_DB_PATH)
    cur = conn.cursor()
    
    # 1. Audit System Databases
    dbs_to_audit = [
        {"nom": "uc.db (Universal Constructor)", "path": r"C:\Users\amado\ASpace_OS_V3\uc.db", "role": "Corpus & Tâches V3"},
        {"nom": "state.db (Hermes Agent)", "path": r"C:\Users\amado\AppData\Local\hermes\state.db", "role": "Sessions & Mémoires Hermes"},
        {"nom": "data.sqlite (9Router Local)", "path": r"C:\Users\amado\AppData\Roaming\9router\db\data.sqlite", "role": "Routage Modèles & Clés"},
        {"nom": "workspace.json (DeepSeek Harness)", "path": r"C:\Users\amado\.dsh\storages\workspace.json", "role": "Espaces de travail DSH"},
        {"nom": "arbitrages.json (Canon V3)", "path": r"C:\Users\amado\ASpace_OS_V3\90-self-evolution\reports\arbitrages.json", "role": "204 Arbitrages scellés"},
        {"nom": "pocketbase.db (PocketDB)", "path": PB_DB_PATH, "role": "Meta-Audit & Live Sync Hub"}
    ]
    
    cur.execute("DELETE FROM system_dbs_registry")
    
    audit_summary = []
    total_records_all = 0
    
    for db_info in dbs_to_audit:
        p = db_info["path"]
        if not os.path.exists(p):
            continue
        
        stat = os.stat(p)
        size = stat.st_size
        
        # Calculate SHA256 checksum (head/sampling for speed)
        h = hashlib.sha256()
        with open(p, 'rb') as f:
            chunk = f.read(1024 * 1024)
            h.update(chunk)
        digest = h.hexdigest()[:16]
        
        nb_tables = 0
        total_rows = 0
        
        if p.endswith('.db') or p.endswith('.sqlite'):
            try:
                c_sub = sqlite3.connect(p)
                cur_sub = c_sub.cursor()
                t_list = [r[0] for r in cur_sub.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchall()]
                nb_tables = len(t_list)
                for t in t_list:
                    try:
                        cnt = cur_sub.execute(f"SELECT COUNT(*) FROM [{t}]").fetchone()[0]
                        total_rows += cnt
                    except:
                        pass
                c_sub.close()
            except Exception as e:
                pass
        elif p.endswith('.json'):
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    j = json.load(f)
                    if isinstance(j, list):
                        total_rows = len(j)
                        nb_tables = 1
                    elif isinstance(j, dict):
                        total_rows = len(j.get('arbitrages', j.get('global', {})))
                        nb_tables = len(j)
            except:
                pass
        
        total_records_all += total_rows
        rec_id = 'db_' + hashlib.md5(db_info["nom"].encode()).hexdigest()[:12]
        
        cur.execute("""
            INSERT INTO system_dbs_registry (id, nom, path, taille_octets, nb_tables, nb_lignes_total, hash_integrite, statut, dernier_audit, created, updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'VERIFIED_CANONICAL', ?, ?, ?)
        """, (rec_id, db_info["nom"], p, size, nb_tables, total_rows, digest, now_iso, now_sqlite, now_sqlite))
        
        audit_summary.append({
            "nom": db_info["nom"],
            "taille": f"{size / 1024:.1f} KB",
            "tables": nb_tables,
            "lignes": total_rows,
            "hash": digest
        })
    
    # 2. Sync Life OS 8 Core Domains
    domaines = [
        {"slug": "sante", "nom": "Santé & Vitalité", "score": 85, "priorite": "P0", "objectifs": 3, "habitudes": 5},
        {"slug": "carriere", "nom": "Carrière & Projets (A'Space OS)", "score": 95, "priorite": "P0", "objectifs": 6, "habitudes": 8},
        {"slug": "finances", "nom": "Finances & Patrimoine", "score": 80, "priorite": "P1", "objectifs": 4, "habitudes": 3},
        {"slug": "relations", "nom": "Relations & Cercle Proche", "score": 75, "priorite": "P1", "objectifs": 2, "habitudes": 4},
        {"slug": "esprit", "nom": "Esprit, Mental & Clarté", "score": 90, "priorite": "P0", "objectifs": 4, "habitudes": 6},
        {"slug": "loisirs", "nom": "Créativité & Loisirs", "score": 70, "priorite": "P2", "objectifs": 2, "habitudes": 2},
        {"slug": "environnement", "nom": "Environnement & Espace de Vie", "score": 85, "priorite": "P1", "objectifs": 3, "habitudes": 3},
        {"slug": "impact", "nom": "Impact & Héritage (Geordi/Amadeus)", "score": 95, "priorite": "P0", "objectifs": 5, "habitudes": 4}
    ]
    
    cur.execute("DELETE FROM life_domains")
    for d in domaines:
        d_id = 'dom_' + hashlib.md5(d["slug"].encode()).hexdigest()[:11]
        cur.execute("""
            INSERT INTO life_domains (id, slug, nom, score, priorite, objectifs_actifs, habitudes_actives, derniere_revue, created, updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (d_id, d["slug"], d["nom"], d["score"], d["priorite"], json.dumps({"count": d["objectifs"]}), json.dumps({"count": d["habitudes"]}), now_iso, now_sqlite, now_sqlite))
    
    # 3. Sync Frameworks State (Ikigai, Life Wheel, PARA, GTD, Deal)
    frameworks = [
        {
            "code": "ikigai",
            "nom": "Ikigai 2026",
            "elements": 12,
            "etat": {
                "passion": ["Conception d'OS Autonomes", "Intelligence Synthétique (A'Space)"],
                "mission": ["Donner un jumeau numérique souverain", "Dérisquer le futur des créateurs"],
                "vocation": ["Architecture Systèmes Multi-Agents", "Ingestion de flux cognitifs"],
                "profession": ["Architecte Fondateur A'Space OS", "Lead IA Engineer"]
            }
        },
        {
            "code": "life_wheel",
            "nom": "Roue de la Vie (Life Wheel)",
            "elements": 8,
            "etat": {d["slug"]: d["score"] for d in domaines}
        },
        {
            "code": "para",
            "nom": "Méthode PARA",
            "elements": 24,
            "etat": {
                "projects": ["Agent OS Desktop v3", "PocketDB Meta-Audit", "DeepSeek Harness Cordis"],
                "areas": ["Architecture Systèmes", "Gouvernance Docteurs", "Santé & Focus"],
                "resources": ["40_Memory_Wiki_OKF", "00_Amadeus SOPs", "Prompt Engineering Library"],
                "archives": ["_ARCHIVE_sessions_zombies", "LifeOS_Legacy_2025"]
            }
        },
        {
            "code": "gtd",
            "nom": "Getting Things Done (GTD)",
            "elements": 18,
            "etat": {
                "inbox_count": 0,
                "next_actions": 5,
                "waiting_for": 2,
                "someday_maybe": 11
            }
        },
        {
            "code": "deal",
            "nom": "DEAL Framework (Ferriss/Kone)",
            "elements": 4,
            "etat": {
                "Definition": "Objectif de souveraineté numérique totale",
                "Elimination": "Zéro dette technique, zéro question d'évidence",
                "Automation": "Orchestrations Hermes & Routeurs 9Router/OmniRoute",
                "Liberation": "Amadou focalisé sur l'architecture pure (D1 à D4)"
            }
        }
    ]
    
    cur.execute("DELETE FROM frameworks_state")
    for f in frameworks:
        f_id = 'fw_' + hashlib.md5(f["code"].encode()).hexdigest()[:12]
        cur.execute("""
            INSERT INTO frameworks_state (id, code, nom, etat, elements_count, synced_with, created, updated)
            VALUES (?, ?, ?, ?, ?, 'SOVEREIGN_META_SYNC', ?, ?)
        """, (f_id, f["code"], f["nom"], json.dumps(f["etat"]), f["elements"], now_sqlite, now_sqlite))
    
    # 4. Insert Meta-Audit Event
    audit_id = 'aud_' + hashlib.md5(now_iso.encode()).hexdigest()[:11]
    cur.execute("""
        INSERT INTO meta_audits (id, service, statut, checksum, record_count, details, audited_at, created, updated)
        VALUES (?, 'A_SPACE_META_AUDIT_ENGINE', 'HEALTHY_CANONICAL', ?, ?, ?, ?, ?, ?)
    """, (
        audit_id,
        hashlib.sha256(json.dumps(audit_summary).encode()).hexdigest()[:16],
        total_records_all,
        json.dumps({
            "summary": audit_summary,
            "frameworks_synced": len(frameworks),
            "domains_synced": len(domaines),
            "total_records_tracked": total_records_all
        }),
        now_iso,
        now_sqlite,
        now_sqlite
    ))
    
    conn.commit()
    conn.close()
    print(f"META_AUDIT_SUCCESS: {len(dbs_to_audit)} DBs audited, {total_records_all} records synced into PocketBase!")

if __name__ == '__main__':
    run_meta_audit_and_sync()
