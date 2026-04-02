'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, User, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  type: 'provider' | 'city' | 'specialty';
  label: string;
  sublabel?: string;
  href: string;
}

interface SearchBarProps {
  variant?: 'hero' | 'nav';
  placeholder?: string;
}

export default function SearchBar({ variant = 'hero', placeholder = 'Search by provider, city, or specialty...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      router.push(results[activeIndex].href);
      setIsOpen(false);
      setQuery('');
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  const iconMap = {
    provider: <User size={16} className="text-rose-400" />,
    city: <MapPin size={16} className="text-gold-400" />,
    specialty: <Search size={16} className="text-mauve-400" />,
  };

  const isHero = variant === 'hero';

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`
          relative flex items-center gap-3 transition-all duration-300
          ${isHero
            ? 'bg-white rounded-2xl px-6 py-4 shadow-[var(--shadow-elevated)] border border-warm-200 focus-within:border-rose-300 focus-within:shadow-[0_8px_40px_rgba(212,85,107,0.1)]'
            : 'bg-warm-100 rounded-xl px-4 py-2.5 border border-transparent focus-within:bg-white focus-within:border-warm-300 focus-within:shadow-[var(--shadow-card)]'
          }
        `}
      >
        <Search
          size={isHero ? 22 : 18}
          className="text-ink-muted shrink-0"
          strokeWidth={2}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            w-full bg-transparent outline-none text-ink placeholder:text-ink-muted
            ${isHero ? 'text-lg' : 'text-sm'}
          `}
          aria-label="Search providers"
          aria-expanded={isOpen}
          aria-controls="search-results"
          role="combobox"
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
        />
        {loading && (
          <Loader2 size={18} className="text-rose-400 animate-spin shrink-0" />
        )}
        {query && !loading && (
          <button
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
            className="text-ink-muted hover:text-ink transition-colors shrink-0"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            id="search-results"
            role="listbox"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[var(--shadow-elevated)] border border-warm-200 overflow-hidden z-50"
          >
            <div className="py-2 max-h-80 overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.href}`}
                  id={`search-result-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => {
                    router.push(result.href);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`
                    w-full flex items-center gap-3 px-5 py-3 text-left transition-colors
                    ${index === activeIndex ? 'bg-rose-50' : 'hover:bg-warm-50'}
                  `}
                >
                  <span className="shrink-0">{iconMap[result.type]}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{result.label}</p>
                    {result.sublabel && (
                      <p className="text-xs text-ink-muted truncate">{result.sublabel}</p>
                    )}
                  </div>
                  <span className="ml-auto text-[11px] uppercase tracking-wider text-ink-muted font-medium shrink-0 opacity-50">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
