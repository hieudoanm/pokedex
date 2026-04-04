import pokemon from '@pokedex/json/pokemon.json';
import { NextPage } from 'next';
import { useState } from 'react';

const AppPage: NextPage = () => {
  const [search, setSearch] = useState('');

  // Filter Pokémon by search term
  const filteredPokemon = pokemon.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-base-100 min-h-screen p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col items-center gap-4">
        <h1 className="text-primary text-4xl font-bold">Pokédex</h1>
        <input
          type="text"
          placeholder="Search Pokémon..."
          className="input input-bordered w-full max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid of Pokémon */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filteredPokemon.map((p) => (
          <div
            key={p.id}
            className="card bg-base-200 flex flex-col items-center rounded-xl p-4 shadow-lg transition-transform hover:scale-105">
            <img
              src={`https://raw.githubusercontent.com/hieudoanm/pokedex/master/packages/data/pokemon/images/${p.id}.png`}
              alt={p.name}
              className="mb-2 h-20 w-20 object-contain"
            />
            <p className="text-center text-lg font-semibold capitalize">
              {p.name}
            </p>
          </div>
        ))}
      </div>

      {filteredPokemon.length === 0 && (
        <p className="mt-8 text-center text-gray-500">No Pokémon found.</p>
      )}
    </div>
  );
};

export default AppPage;
