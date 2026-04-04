import pokemon from '@pokedex/json/pokemon.json';
import { NextPage } from 'next';
import { useState } from 'react';

const AppPage: NextPage = () => {
  const [search, setSearch] = useState('');

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

      {/* Grid with fully responsive 12-column layout */}
      <div className="grid grid-cols-12 gap-4">
        {filteredPokemon.map((p) => (
          <div
            key={p.id}
            className="/* xs: 1 per row */ /* sm: 2 per row */ /* md: 3 per row */ /* lg: 4 per row */ /* xl: 6 per row */ /* 2xl: 12 per row */ col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3 xl:col-span-2 2xl:col-span-1">
            <div className="card bg-base-200 flex flex-col items-center rounded-xl p-4 shadow-lg transition-transform hover:scale-105">
              <img
                src={`https://raw.githubusercontent.com/hieudoanm/pokedex/master/packages/data/pokemon/images/${p.name}.png`}
                alt={p.name}
                className="mb-2 h-20 w-20 object-contain"
              />
              <p className="text-center text-lg font-semibold capitalize">
                {p.name}
              </p>
            </div>
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
