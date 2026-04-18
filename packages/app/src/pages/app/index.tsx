'use client';

import pokemon from '@pokedex/json/pokemon.json';
import { NextPage } from 'next';
import { useMemo, useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

type Pokemon = {
  id: number;
  name: string;
  type: string;
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
};

type SortKey = 'id' | 'hp' | 'attack' | 'speed';
type SortOrder = 'asc' | 'desc';

/* =========================
   STATS MAX
========================= */
const getMaxStats = (data: Pokemon[]) =>
  data.reduce(
    (acc, p) => ({
      hp: Math.max(acc.hp, p.hp),
      attack: Math.max(acc.attack, p.attack),
      defense: Math.max(acc.defense, p.defense),
      special_attack: Math.max(acc.special_attack, p.special_attack),
      special_defense: Math.max(acc.special_defense, p.special_defense),
      speed: Math.max(acc.speed, p.speed),
    }),
    {
      hp: 0,
      attack: 0,
      defense: 0,
      special_attack: 0,
      special_defense: 0,
      speed: 0,
    }
  );

/* =========================
   TYPE COLORS
========================= */
const getTypeColor = (type: string) => {
  const map: Record<string, string> = {
    fire: 'badge-error',
    water: 'badge-info',
    grass: 'badge-success',
    electric: 'badge-warning',
    rock: 'badge-neutral',
    ground: 'badge-neutral',
    psychic: 'badge-secondary',
    ice: 'badge-info',
    dragon: 'badge-primary',
    dark: 'badge-neutral',
    fairy: 'badge-secondary',
    normal: 'badge-ghost',
    fighting: 'badge-error',
    poison: 'badge-secondary',
    bug: 'badge-success',
    ghost: 'badge-neutral',
    steel: 'badge-ghost',
    flying: 'badge-info',
  };

  return map[type] || 'badge-ghost';
};

/* =========================
   FUZZY SEARCH (lightweight)
========================= */
const fuzzyMatch = (text: string, query: string) => {
  if (!query) return 1;

  text = text.toLowerCase();
  query = query.toLowerCase();

  let ti = 0;
  for (let qi = 0; qi < query.length; qi++) {
    const q = query[qi];
    let found = false;

    while (ti < text.length) {
      if (text[ti] === q) {
        found = true;
        ti++;
        break;
      }
      ti++;
    }

    if (!found) return 0;
  }

  return 1;
};

/* =========================
   APP
========================= */
const AppPage: NextPage = () => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Pokemon | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [sortKeys, setSortKeys] = useState<SortKey[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const data = pokemon as Pokemon[];

  /* =========================
     TYPES (sorted + memoized)
  ========================= */
  const allTypes = useMemo(
    () =>
      Array.from(new Set(data.map((p) => p.type))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [data]
  );

  /* =========================
     FILTER + FUZZY SEARCH + SORT (OPTIMIZED PIPELINE)
  ========================= */
  const filteredPokemon = useMemo(() => {
    let result = data;

    // fuzzy search
    if (search) {
      result = result
        .map((p) => ({
          p,
          score: fuzzyMatch(p.name, search),
        }))
        .filter((x) => x.score > 0)
        .map((x) => x.p);
    }

    // type filter
    if (typeFilter) {
      result = result.filter((p) => p.type === typeFilter);
    }

    // sorting
    const keys = sortKeys.length ? sortKeys : ['id'];

    return [...result].sort((a, b) => {
      for (const key of keys) {
        const diff =
          (a[key as keyof Pokemon] as number) -
          (b[key as keyof Pokemon] as number);

        if (diff !== 0) {
          return sortOrder === 'asc' ? diff : -diff;
        }
      }
      return 0;
    });
  }, [search, typeFilter, sortKeys, sortOrder, data]);

  /* =========================
     RADAR DATA
  ========================= */
  const radarData = useMemo(() => {
    if (!selected) return [];
    return [
      { stat: 'HP', value: selected.hp },
      { stat: 'ATK', value: selected.attack },
      { stat: 'DEF', value: selected.defense },
      { stat: 'SP.A', value: selected.special_attack },
      { stat: 'SP.D', value: selected.special_defense },
      { stat: 'SPD', value: selected.speed },
    ];
  }, [selected]);

  /* =========================
     SORT HELPERS
  ========================= */
  const toggleSortKey = (key: SortKey) => {
    setSortKeys((prev) =>
      prev[0] === key ? prev.slice(1) : [key, ...prev.filter((k) => k !== key)]
    );
  };

  const toggleSortOrder = () =>
    setSortOrder((p) => (p === 'asc' ? 'desc' : 'asc'));

  /* =========================
     UI
  ========================= */
  return (
    <div
      className="bg-base-100 text-base-content min-h-screen"
      data-theme="luxury">
      <div className="flex flex-col md:flex-row">
        {/* =========================
            SIDEBAR (responsive)
        ========================= */}
        <aside className="bg-base-200 border-base-300 flex w-full gap-2 overflow-x-auto border-b p-3 md:sticky md:top-0 md:h-screen md:w-60 md:flex-col md:border-r md:border-b-0">
          <button
            onClick={() => setTypeFilter('')}
            className={`btn btn-sm ${typeFilter === '' ? 'btn-primary' : 'btn-ghost'}`}>
            All
          </button>

          {allTypes.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`btn btn-sm capitalize ${
                typeFilter === t ? 'btn-primary' : 'btn-ghost'
              }`}>
              {t}
            </button>
          ))}

          {/* SORT */}
          <div className="mt-4 flex flex-col gap-2">
            {(['hp', 'attack', 'speed'] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => toggleSortKey(key)}
                className={`btn btn-xs ${
                  sortKeys.includes(key) ? 'btn-primary' : 'btn-ghost'
                }`}>
                {key.toUpperCase()}
              </button>
            ))}

            <button onClick={toggleSortOrder} className="btn btn-xs btn-ghost">
              {sortOrder === 'asc' ? 'ASC ↑' : 'DESC ↓'}
            </button>
          </div>
        </aside>

        {/* =========================
            MAIN
        ========================= */}
        <main className="flex-1 p-4 md:p-6">
          {/* SEARCH */}
          <input
            className="input input-bordered mb-4 w-full md:w-80"
            placeholder="Search Pokémon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* GRID */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filteredPokemon.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                className="bg-base-200 cursor-pointer rounded-lg p-3 text-center transition hover:-translate-y-1">
                <img
                  src={`https://raw.githubusercontent.com/hieudoanm/pokedex/master/packages/data/pokemon/images/${p.name}.png`}
                  className="mx-auto h-14 w-14"
                  alt={p.name}
                />

                <p className="text-xs">#{p.id}</p>
                <p className="capitalize">{p.name.replaceAll('-', ' ')}</p>

                <div className={`badge ${getTypeColor(p.type)} mt-1`}>
                  {p.type}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* =========================
          MODAL + RADAR
      ========================= */}
      {selected && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="text-lg font-bold capitalize">{selected.name}</h3>

            <div className={`badge ${getTypeColor(selected.type)} mt-2`}>
              {selected.type}
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="stat" />
                  <PolarRadiusAxis />
                  <Radar
                    dataKey="value"
                    stroke="#60a5fa"
                    fill="#60a5fa"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <button className="btn mt-4" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppPage;
