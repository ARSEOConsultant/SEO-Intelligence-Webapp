import React, { useState, useEffect } from 'react';
import { Newspaper, Send, Search, BellRing, Menu, Loader2, Info, Activity, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Type, AlignJustify } from 'lucide-react';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog';
import Markdown from 'react-markdown';
import TrendingTopics from './components/TrendingTopics';
import ConfigureFeed, { FeedPrefs } from './components/ConfigureFeed';

const CATEGORIES = [
  'My Feed',
  'AI SEO',
  'Content Strategy',
  'Ecommerce SEO',
  'International SEO',
  'Local SEO',
  'Technical SEO',
  'Algorithm Updates',
  'Backlink Strategy'
];

export default function App() {
  const [activeTab, setActiveTab] = useState(CATEGORIES[0]);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [newsContent, setNewsContent] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  
  const [prefs, setPrefs] = useState<FeedPrefs>(() => {
    const saved = localStorage.getItem('seo-feed-prefs');
    return saved ? JSON.parse(saved) : { categories: ['Technical SEO'], sources: ['Search Engine Land'] };
  });

  const [fontSize, setFontSize] = useState<string>(() => localStorage.getItem('prefs-fontSize') || '0.875rem');
  const [lineSpacing, setLineSpacing] = useState<string>(() => localStorage.getItem('prefs-lineSpacing') || '1.625');

  useEffect(() => {
    localStorage.setItem('prefs-fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('prefs-lineSpacing', lineSpacing);
  }, [lineSpacing]);

  useEffect(() => {
    localStorage.setItem('seo-feed-prefs', JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    setPage(1); // Reset page on tab change
  }, [activeTab]);

  useEffect(() => {
    async function fetchNews(category: string, currentPage: number) {
      const cacheKey = `${category}-p${currentPage}`;
      // Force refetch for My Feed if it changes, otherwise use cache
      if (newsContent[cacheKey] && category !== 'My Feed') {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let queryCategory = category;
        if (category === 'AI SEO') {
          queryCategory = 'AI SEO (including AEO and GEO)';
        } else if (category === 'Local SEO') {
          queryCategory = 'Local SEO (including Google Business Profile)';
        } else if (!category.startsWith('Trend: ') && !category.startsWith('Search: ') && category !== 'My Feed' && !category.endsWith('SEO') && !category.endsWith('Updates') && !category.endsWith('Strategy')) {
          queryCategory = category + ' SEO';
        }

        let url = `/api/news?category=${encodeURIComponent(queryCategory)}&page=${currentPage}`;
        if (category.startsWith('Search: ')) {
          const query = category.substring(8);
          url = `/api/news?category=Search&searchQuery=${encodeURIComponent(query)}&page=${currentPage}`;
        } else if (category === 'My Feed') {
           url += `&prefs=${encodeURIComponent(JSON.stringify(prefs))}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch news');
        
        setNewsContent(prev => ({ ...prev, [cacheKey]: data.content }));
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching news.');
      } finally {
        setLoading(false);
      }
    }

    fetchNews(activeTab, page);
  }, [activeTab, page, prefs, refreshKey]);

  const [refreshCooldown, setRefreshCooldown] = useState<number>(0);
  
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setInterval(() => {
        setRefreshCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [refreshCooldown]);

  const handleRefresh = () => {
    if (refreshCooldown > 0) return;

    setNewsContent(prev => {
      const newCache = { ...prev };
      delete newCache[`${activeTab}-p${page}`];
      return newCache;
    });
    setRefreshKey(k => k + 1);
    setRefreshCooldown(300); // 5 minutes in seconds
  };

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubscribing(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          consent: formData.get('consent') === 'on'
        })
      });
      if (res.ok) {
        setSubscribed(true);
      } else {
        alert("There was an error subscribing. Please try again.");
      }
    } catch {
      alert("There was an error subscribing. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  const handleSelectTrend = (trend: string) => {
    const trendTab = `Trend: ${trend}`;
    if (!CATEGORIES.includes(trendTab) && !newsContent[trendTab]) {
      // Optionally add to categories if you want it to appear as a tab, 
      // but it's cleaner to just set it as active without being in the fixed array 
      // or we can just set it as active directly.
    }
    setActiveTab(trendTab);
    setTimeout(() => {
      document.getElementById('main-feed-content')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const searchTab = `Search: ${searchQuery.trim()}`;
    setActiveTab(searchTab);
    setSearchQuery('');
    setTimeout(() => {
      document.getElementById('main-feed-content')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-bg-primary text-gray-200 flex flex-col font-sans">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border-dark bg-bg-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent flex items-center justify-center rounded-sm">
              <span className="text-black font-bold text-xl font-sans tracking-tighter">S</span>
            </div>
            <h1 className="font-serif text-2xl tracking-tight font-light text-white hidden sm:block">SEO <span className="text-accent">INTELLIGENCE</span></h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="hidden lg:flex items-center gap-4 text-xs uppercase tracking-widest text-text-muted mr-2">
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <div className="h-4 w-px bg-border-dark"></div>
              <span>Market Pulse: <span className="text-accent">Active</span></span>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="flex relative items-center">
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-32 sm:w-48 md:w-64 rounded-sm border border-border-dark bg-bg-secondary px-3 py-1 text-xs placeholder:text-gray-500 pr-10 focus:outline-none focus:ring-1 focus:border-accent focus:ring-accent text-white"
              />
              <button type="submit" className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center text-gray-500 hover:text-accent disabled:opacity-50" disabled={!searchQuery.trim()}>
                <Search className="h-4 w-4" />
              </button>
            </form>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="hidden sm:flex items-center gap-2">
                  <BellRing className="h-4 w-4" /> Subscribe
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>AI Intelligence Weekly</DialogTitle>
                  <DialogDescription>
                    The exclusive SEO briefing delivered to your inbox.
                  </DialogDescription>
                </DialogHeader>
                {!subscribed ? (
                  <form onSubmit={handleSubscribe} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <input id="name" name="name" required className="flex h-10 w-full rounded-sm border border-border-dark bg-bg-primary px-3 py-2 text-xs placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:border-accent focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50 text-white" placeholder="Full Name" />
                    </div>
                    <div className="space-y-2">
                      <input id="email" name="email" type="email" required className="flex h-10 w-full rounded-sm border border-border-dark bg-bg-primary px-3 py-2 text-xs placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:border-accent focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50 text-white" placeholder="Email Address" />
                    </div>
                    <div className="flex items-start space-x-2 pt-2">
                      <input type="checkbox" id="consent" name="consent" required className="h-4 w-4 rounded-sm border-border-dark bg-bg-primary text-accent focus:ring-accent mt-1 cursor-pointer accent-accent" />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor="consent" className="text-xs font-medium text-gray-300 cursor-pointer">
                          I agree to receive the weekly newsletter
                        </label>
                        <p className="text-[10px] text-gray-500 max-w-sm">
                          GDPR Compliant. No spam. Unsubscribe at any time.
                        </p>
                      </div>
                    </div>
                    <Button type="submit" disabled={subscribing} className="w-full">
                      {subscribing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subscribing...</> : 'Subscribe Now'}
                    </Button>
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3 py-6 px-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-border-dark flex items-center justify-center mb-2">
                      <Send className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="text-lg font-serif text-white">You're all set!</h3>
                    <p className="text-sm text-gray-400">
                      Thanks for subscribing. Keep an eye on your inbox for our next weekly SEO digest!
                    </p>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" className="sm:hidden text-text-muted hover:text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col py-8 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-col items-center mb-10 text-center">
          <span className="text-accent text-[10px] uppercase tracking-[0.3em] font-bold mb-3">Daily Briefing</span>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-white tracking-tight mb-4">
             Today's SEO Intelligence
          </h2>
          <p className="text-sm text-gray-400 max-w-2xl">
            Real-time industry shifts, algorithm watch, and expert strategies curated into a beautiful daily dashboard. Powered by AI search.
          </p>
        </div>

        <div className="container mx-auto px-0 sm:px-6 lg:px-8 max-w-7xl flex-1 flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1 flex flex-col min-w-0" id="main-feed-content">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
              <div className="w-full overflow-x-auto justify-start sm:justify-center flex no-scrollbar bg-bg-secondary border-y border-border-dark sm:rounded-sm sm:border">
                <TabsList className="bg-transparent border-0 px-2 sm:px-6 max-w-full overflow-x-auto justify-start">
                  {CATEGORIES.map(category => (
                    <TabsTrigger 
                      key={category} 
                      value={category}
                    >
                      {category}
                    </TabsTrigger>
                  ))}
                  {activeTab.startsWith('Trend: ') && (
                    <TabsTrigger value={activeTab}>
                      <Activity className="w-3 h-3 mr-1 inline" /> {activeTab}
                    </TabsTrigger>
                  )}
                  {activeTab.startsWith('Search: ') && (
                    <TabsTrigger value={activeTab}>
                      <Search className="w-3 h-3 mr-1 inline" /> {activeTab}
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
              
              <div className="w-full mt-6 bg-[linear-gradient(145deg,#1a1d23_0%,#14161a_100%)] border border-border-dark sm:rounded-sm shadow-xl p-6 sm:p-10 min-h-[500px] relative">
                {activeTab === 'My Feed' && (
                  <div className="absolute top-6 right-6 z-10">
                    <ConfigureFeed prefs={prefs} onSave={(p) => { setPrefs(p); setNewsContent(prev => ({...prev, 'My Feed': ''})) }} />
                  </div>
                )}
                
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 text-text-muted min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    <p className="text-xs font-medium uppercase tracking-widest animate-pulse">Analyzing feeds for {activeTab}...</p>
                  </div>
                ) : error ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-3 text-text-muted min-h-[400px]">
                    <Info className="h-8 w-8 text-red-500" />
                    <p className="text-white font-medium">Failed to fetch news.</p>
                    <p className="text-sm max-w-md text-center text-gray-400">{error}</p>
                    <Button variant="outline" onClick={() => setActiveTab(activeTab)} className="mt-4">Try Again</Button>
                  </div>
                ) : (
                  <div className="flex flex-col-reverse sm:flex-row gap-4 lg:gap-8 items-stretch sm:items-start relative max-w-5xl mx-auto pt-4">
                    <div className="markdown-body flex-1 min-w-0" style={{ '--md-font-size': fontSize, '--md-line-height': lineSpacing } as React.CSSProperties}>
                      <Markdown 
                        components={{
                          a: ({node, href, children, ...props}) => {
                            return (
                              <span 
                                onClick={() => href && window.open(href, '_blank', 'noopener,noreferrer')} 
                                className="text-accent hover:underline cursor-pointer transition-colors"
                                title={href}
                                {...(props as any)}
                              >
                                {children}
                              </span>
                            );
                          }
                        }}
                      >
                        {newsContent[`${activeTab}-p${page}`] || 'No content available right now.'}
                      </Markdown>
                    </div>
                    <div className="sm:sticky sm:top-28 flex sm:flex-col shrink-0 gap-3 items-center bg-bg-secondary p-3 rounded-sm border border-border-dark justify-center self-end sm:self-start mb-4 sm:mb-0">
                      <Button onClick={() => { setPage(p => Math.max(1, p - 1)); document.getElementById('main-feed-content')?.scrollIntoView({ behavior: 'smooth' }); }} disabled={page === 1} size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-bg-primary"> 
                         <ChevronLeft className="h-4 w-4 sm:hidden" />
                         <ChevronUp className="h-4 w-4 hidden sm:block" />
                      </Button>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 whitespace-nowrap">Pg {page}</span>
                      <Button onClick={() => { setPage(p => p + 1); document.getElementById('main-feed-content')?.scrollIntoView({ behavior: 'smooth' }); }} size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-bg-primary"> 
                         <ChevronRight className="h-4 w-4 sm:hidden" />
                         <ChevronDown className="h-4 w-4 hidden sm:block" />
                      </Button>
                      <div className="w-px h-6 sm:w-6 sm:h-px bg-border-dark my-1 mx-1 sm:mx-0"></div>
                      <Button 
                        onClick={handleRefresh} 
                        size="icon" 
                        variant="ghost" 
                        disabled={refreshCooldown > 0}
                        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-bg-primary disabled:opacity-50" 
                        title={refreshCooldown > 0 ? `Refresh available in ${Math.ceil(refreshCooldown / 60)}m` : "Refresh Feed"}
                      >
                         <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-bg-primary" title="Reader Settings">
                            <Type className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-bg-primary border-border-dark text-gray-200">
                          <DialogHeader>
                            <DialogTitle className="text-white font-serif font-light text-2xl">Typography & Layout</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Adjust readability settings.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-6 py-4">
                            <div className="space-y-4">
                              <h4 className="text-xs uppercase tracking-widest text-text-muted font-bold">Font Size</h4>
                              <div className="flex gap-2">
                                {[ {label: 'Small', value: '0.875rem'}, {label: 'Normal', value: '1rem'}, {label: 'Large', value: '1.125rem'}].map(opt => (
                                  <Button 
                                    key={opt.value}
                                    variant={fontSize === opt.value ? 'default' : 'outline'}
                                    onClick={() => setFontSize(opt.value)}
                                    className={`flex-1 text-xs ${fontSize === opt.value ? 'bg-accent text-black hover:bg-accent-hover border-transparent' : 'bg-transparent text-gray-300 hover:text-white border-border-dark hover:border-gray-500'}`}
                                  >
                                    {opt.label}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-4">
                              <h4 className="text-xs uppercase tracking-widest text-text-muted font-bold">Line Spacing</h4>
                              <div className="flex gap-2">
                                {[ {label: 'Tight', value: '1.4'}, {label: 'Normal', value: '1.625'}, {label: 'Relaxed', value: '1.85'}].map(opt => (
                                  <Button 
                                    key={opt.value}
                                    variant={lineSpacing === opt.value ? 'default' : 'outline'}
                                    onClick={() => setLineSpacing(opt.value)}
                                    className={`flex-1 text-xs px-2 ${lineSpacing === opt.value ? 'bg-accent text-black hover:bg-accent-hover border-transparent' : 'bg-transparent text-gray-300 hover:text-white border-border-dark hover:border-gray-500'}`}
                                  >
                                    {opt.label}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}
              </div>
            </Tabs>
          </div>
          
          <aside className="w-full lg:w-[350px] shrink-0 flex flex-col gap-8">
            <div className="bg-bg-secondary p-6 rounded-sm border border-border-dark shadow-xl">
               <div className="flex items-center gap-2 mb-2">
                 <Activity className="h-4 w-4 text-accent" />
                 <h3 className="text-xs uppercase tracking-widest text-white font-bold">Trending Topics</h3>
               </div>
               <p className="text-[10px] text-gray-500 tracking-wider mb-2">Based on live RSS analysis of SEO articles in the past 7 days. Click on a trend to generate a deep-dive feed.</p>
               <TrendingTopics onSelectTrend={handleSelectTrend} activeTab={activeTab} />
            </div>
            
            <div className="mt-auto flex flex-col gap-4 p-6 rounded bg-bg-secondary border border-accent/30 bg-[linear-gradient(145deg,#1a1d23_0%,#14161a_100%)] shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
               <div className="flex flex-col gap-1 relative z-10">
                 <h3 className="font-serif text-xl border-l-[3px] border-accent pl-3 text-white">Unlock SEO Insights</h3>
                 <p className="text-[11px] text-gray-400 leading-relaxed mt-2">
                   Get exclusive strategies, algorithm tear-downs, and expert interviews that aren't shared on the blog.
                 </p>
               </div>
               <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full mt-2 relative z-10">Subscribe to Weekly</Button>
                </DialogTrigger>
                {/* Re-use DialogContent here for brevity or assume they can use header one */}
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>AI Intelligence Weekly</DialogTitle>
                    <DialogDescription>
                      The exclusive SEO briefing delivered to your inbox.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubscribe} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <input id="name2" name="name" required className="flex h-10 w-full rounded-sm border border-border-dark bg-bg-primary px-3 py-2 text-xs placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:border-accent focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50 text-white" placeholder="Full Name" />
                      </div>
                      <div className="space-y-2">
                        <input id="email2" name="email" type="email" required className="flex h-10 w-full rounded-sm border border-border-dark bg-bg-primary px-3 py-2 text-xs placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:border-accent focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50 text-white" placeholder="Email Address" />
                      </div>
                      <div className="flex items-start space-x-2 pt-2">
                        <input type="checkbox" id="consent2" name="consent" required className="h-4 w-4 rounded-sm border-border-dark bg-bg-primary text-accent focus:ring-accent mt-1 cursor-pointer accent-accent" />
                        <div className="grid gap-1.5 leading-none">
                          <label htmlFor="consent2" className="text-xs font-medium text-gray-300 cursor-pointer">
                            I agree to receive the weekly newsletter
                          </label>
                          <p className="text-[10px] text-gray-500 max-w-sm">
                            GDPR Compliant. No spam. Unsubscribe at any time.
                          </p>
                        </div>
                      </div>
                      <Button type="submit" disabled={subscribing} className="w-full">
                        {subscribing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subscribing...</> : 'Subscribe Now'}
                      </Button>
                    </form>
                </DialogContent>
               </Dialog>
            </div>
          </aside>
        </div>
      </main>
      
      <footer className="w-full border-t border-border-dark bg-bg-primary py-8 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-col md:flex-row items-center justify-between">
          <p className="text-xs text-text-muted tracking-widest uppercase">© {new Date().getFullYear()} SEO Intelligence. AI-curated news.</p>
          <div className="flex gap-6 mt-4 md:mt-0 text-xs text-text-muted uppercase tracking-widest">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

