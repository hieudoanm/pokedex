import asyncio
import aiohttp
import aiofiles
import sqlite3
import json
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
# SQLite setup
# =========================
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pokemon (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        )
    """)
    conn.commit()
    return conn


def store_pokemon(conn, pokemon_id: int, name: str):
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO pokemon (id, name) VALUES (?, ?)", (pokemon_id, name)
    )
    conn.commit()


# =========================
# Async download file
# =========================
async def download_file(session: aiohttp.ClientSession, url: str, filepath: Path):
    try:
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
async def fetch_pokemon(
    session: aiohttp.ClientSession, poke: Dict, index: int, conn
) -> Dict:
    try:
        async with session.get(poke["url"]) as resp:
            resp.raise_for_status()
            data = await resp.json()

            # Download sprite if available
            sprite_url = data.get("sprites", {}).get("front_default")
            if sprite_url:
                file_path = PNG_DIR / f"{data['name'].lower()}.png"
                await download_file(session, sprite_url, file_path)

            # Store id and name in SQLite
            store_pokemon(conn, index + 1, data["name"])

            # Return only id and name for JSON
            return {"id": index + 1, "name": data["name"]}
    except Exception as e:
        print(f"Error fetching {poke['name']}: {e}")
        return {}


# =========================
# Main async function
# =========================
async def main():
    conn = init_db()
    async with aiohttp.ClientSession() as session:
        # Get list of all Pokémon
        async with session.get(
            "https://pokeapi.co/api/v2/pokemon?limit=1000000"
        ) as resp:
            resp.raise_for_status()
            results = (await resp.json()).get("results", [])

        all_pokemon_data: List[Dict] = []

        # Use semaphore to limit concurrent requests
        sem = asyncio.Semaphore(MAX_CONCURRENT)

        async def sem_fetch(poke, idx):
            async with sem:
                return await fetch_pokemon(session, poke, idx, conn)

        # Schedule tasks
        tasks = [
            asyncio.create_task(sem_fetch(poke, idx))
            for idx, poke in enumerate(results)
        ]
        for idx, task in enumerate(asyncio.as_completed(tasks), start=1):
            data = await task
            if data:
                all_pokemon_data.append(data)
                print(f"{idx}/{len(results)}: {data.get('name')} processed")

        # Save full data (id & name only) to JSON asynchronously
        JSON_PATH = Path(JSON_FILE)
        JSON_PATH.parent.mkdir(exist_ok=True, parents=True)
        async with aiofiles.open(JSON_FILE, "w", encoding="utf-8") as f:
            await f.write(json.dumps(all_pokemon_data, ensure_ascii=False, indent=2))

    conn.close()
    print(f"All done! Full data saved to {JSON_FILE}")


# =========================
# Run
# =========================
if __name__ == "__main__":
    asyncio.run(main())
