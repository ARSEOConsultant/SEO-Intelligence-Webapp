import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Settings2 } from 'lucide-react';

export interface FeedPrefs {
  categories: string[];
  sources: string[];
}

interface ConfigureFeedProps {
  prefs: FeedPrefs;
  onSave: (prefs: FeedPrefs) => void;
}

const ALL_CATEGORIES = [
  'AI SEO',
  'Content Strategy',
  'Ecommerce SEO',
  'International SEO',
  'Local SEO',
  'Technical SEO',
  'Algorithm Updates',
  'Backlink Strategy'
];
const ALL_SOURCES = ['Search Engine Land', 'Search Engine Roundtable', 'Moz', 'Ahrefs', 'Semrush', 'Lily Ray', 'Barry Schwartz', 'Cyrus Shepard', 'Marie Haynes'];

export default function ConfigureFeed({ prefs, onSave }: ConfigureFeedProps) {
  const [open, setOpen] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>(prefs.categories);
  const [selectedSources, setSelectedSources] = useState<string[]>(prefs.sources);

  useEffect(() => {
    if (open) {
      setSelectedCats(prefs.categories);
      setSelectedSources(prefs.sources);
    }
  }, [open, prefs]);

  const toggleCat = (cat: string) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const toggleSource = (source: string) => {
    setSelectedSources(prev => prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]);
  };

  const handleSave = () => {
    onSave({ categories: selectedCats, sources: selectedSources });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="flex items-center gap-2">
        <Settings2 className="h-4 w-4" />
        Configure Feed
      </Button>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Personalize Your Feed</DialogTitle>
          <DialogDescription>
            Select your favorite topics and sources to curate your "My Feed" dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div>
            <h4 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-3">Preferred Categories</h4>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCat(cat)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    selectedCats.includes(cat) 
                      ? 'bg-accent/20 border-accent text-accent'
                      : 'bg-bg-primary border-border-dark text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-3">Preferred Sources & Experts</h4>
            <div className="flex flex-wrap gap-2">
              {ALL_SOURCES.map(source => (
                <button
                  key={source}
                  type="button"
                  onClick={() => toggleSource(source)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    selectedSources.includes(source) 
                      ? 'bg-accent/20 border-accent text-accent'
                      : 'bg-bg-primary border-border-dark text-gray-400 hover:text-white'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleSave} className="w-full">
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
