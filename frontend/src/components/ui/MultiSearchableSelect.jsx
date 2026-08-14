import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export function MultiSearchableSelect({ 
  options, 
  value, // Array of strings/ids
  onChange, 
  placeholder = "Select...", 
  className = "",
  allowAll = false,
  allLabel = "All"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = query === '' 
    ? options 
    : options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));

  const handleToggle = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleToggleAll = () => {
    if (value.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.value));
    }
  };

  const displayLabel = value.length === 0 
    ? placeholder 
    : value.length === options.length && allowAll
      ? allLabel
      : `${value.length} selected`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/35"
      >
        <span className={value.length > 0 ? 'text-slate-900' : 'text-slate-500'}>
          {displayLabel}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg flex flex-col">
          <div className="bg-white px-2 py-2 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                className="w-full rounded-lg bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-brand/20"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="overflow-y-auto py-1 flex-1">
            {allowAll && query === '' && (
              <button
                type="button"
                onClick={handleToggleAll}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${value.length === options.length ? 'bg-slate-50 font-medium text-brand' : 'text-slate-700'}`}
              >
                <span className="truncate">{allLabel}</span>
                {value.length === options.length && <Check className="ml-2 h-4 w-4 shrink-0 text-brand" />}
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">No results found.</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(option.value);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${value.includes(option.value) ? 'bg-slate-50 font-medium text-brand' : 'text-slate-700'}`}
                >
                  <span className="truncate">{option.label}</span>
                  {value.includes(option.value) && <Check className="ml-2 h-4 w-4 shrink-0 text-brand" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
