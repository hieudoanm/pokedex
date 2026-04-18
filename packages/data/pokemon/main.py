import asyncio
import aiohttp
import aiofiles
import sqlite3
import json
import os
from pathlib import Path
from typing import List, Dict

# =========================
# Config
# =========================
DB_FILE = "./db/pokemon.db"
JSON_FILE = "./json/pokemon.json"
PNG_DIR = Path("./images")
PNG_DIR.mkdir(exist_ok=True, parents=True)
MAX_CONCURRENT = 10  # number of concurrent requests


# =========================
# Reset DB file (REMOVE FILE FIRST)
# =========================
def reset_db_file():
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
        print(f"🗑️ Removed existing DB: {DB_FILE}")


# =========================
# SQLite setup
# =========================
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pokemon (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            hp INTEGER DEFAULT 0,
            attack INTEGER DEFAULT 0,
            defense INTEGER DEFAULT 0,
            special_attack INTEGER DEFAULT 0,
            special_defense INTEGER DEFAULT 0,
            speed INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    return conn


def store_pokemon(conn, pokemon: Dict):
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT OR REPLACE INTO pokemon
        (id, name, type, hp, attack, defense, special_attack, special_defense, speed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            pokemon["id"],
            pokemon["name"],
            pokemon["type"],
            pokemon["hp"],
            pokemon["attack"],
            pokemon["defense"],
            pokemon["special_attack"],
            pokemon["special_defense"],
            pokemon["speed"],
        ),
    )
    conn.commit()


# =========================
# Async download file
# =========================
async def download_file(session: aiohttp.ClientSession, url: str, filepath: Path):
    try:
        if filepath.exists():
            return

        async with session.get(url) as resp:
            resp.raise_for_status()
            async with aiofiles.open(filepath, "wb") as f:
                async for chunk in resp.content.iter_chunked(8192):
                    await f.write(chunk)
    except Exception as e:
        print(f"Error downloading {url}: {e}")


# =========================
# Fetch Pokémon detail
# =========================
async def fetch_pokemon(session: aiohttp.ClientSession, poke: Dict, conn) -> Dict:
    try:
        async with session.get(poke["url"]) as resp:
            resp.raise_for_status()
            data = await resp.json()

            # =========================
            # Extract stats
            # =========================
            stats_map = {
                "hp": 0,
                "attack": 0,
                "defense": 0,
                "special-attack": 0,
                "special-defense": 0,
                "speed": 0,
            }

            for s in data.get("stats", []):
                stats_map[s["stat"]["name"]] = s["base_stat"]

            # =========================
            # FIRST TYPE ONLY
            # =========================
            types = data.get("types", [])
            primary_type = types[0]["type"]["name"] if types else None

            pokemon_data = {
                "id": data["id"],
                "name": data["name"],
                "type": primary_type,
                "hp": stats_map["hp"],
                "attack": stats_map["attack"],
                "defense": stats_map["defense"],
                "special_attack": stats_map["special-attack"],
                "special_defense": stats_map["special-defense"],
                "speed": stats_map["speed"],
            }

            # =========================
            # Download sprite
            # =========================
            sprite_url = data.get("sprites", {}).get("front_default")
            if sprite_url:
                file_path = PNG_DIR / f"{data['name'].lower()}.png"
                await download_file(session, sprite_url, file_path)

            # =========================
            # Store in DB
            # =========================
            store_pokemon(conn, pokemon_data)

            return pokemon_data

    except Exception as e:
        print(f"Error fetching {poke['name']}: {e}")
        return {}


# =========================
# Main async function
# =========================
async def main():
    # 🔥 remove old DB before starting
    reset_db_file()

    conn = init_db()

    async with aiohttp.ClientSession() as session:
        async with session.get(
            "https://pokeapi.co/api/v2/pokemon?limit=1000000"
        ) as resp:
            resp.raise_for_status()
            results = (await resp.json()).get("results", [])

        all_pokemon_data: List[Dict] = []

        sem = asyncio.Semaphore(MAX_CONCURRENT)

        async def sem_fetch(poke):
            async with sem:
                return await fetch_pokemon(session, poke, conn)

        tasks = [asyncio.create_task(sem_fetch(poke)) for poke in results]

        for idx, task in enumerate(asyncio.as_completed(tasks), start=1):
            data = await task
            if data:
                all_pokemon_data.append(data)
                print(f"{idx}/{len(results)}: {data.get('name')} processed")

        # =========================
        # Save JSON
        # =========================
        JSON_PATH = Path(JSON_FILE)
        JSON_PATH.parent.mkdir(exist_ok=True, parents=True)

        async with aiofiles.open(JSON_FILE, "w", encoding="utf-8") as f:
            await f.write(json.dumps(all_pokemon_data, ensure_ascii=False, indent=2))

    conn.close()
    print(f"✅ Done! Data saved to {JSON_FILE}")


# =========================
# Run
# =========================
if __name__ == "__main__":
    asyncio.run(main())
