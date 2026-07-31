/**
 * Landing page — soft-3D clay theme.
 * Uses plain <a href> (not router.push) so Sign In / Register navigate instantly
 * even while Next is still compiling the destination route.
 */
export default function Home() {
  const features = [
    {
      title: 'AI meal plans',
      desc: 'Weekly plates built around your goals, budget, and preferences.',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-emerald-800" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3L4 9V21H20V9L12 3ZM12 7.7C13.27 7.7 14.3 8.73 14.3 10C14.3 11.27 13.27 12.3 12 12.3C10.73 12.3 9.7 11.27 9.7 10C9.7 8.73 10.73 7.7 12 7.7ZM18 19H6V10.2L12 5.69L18 10.2V19Z" />
        </svg>
      ),
    },
    {
      title: 'Smart grocery lists',
      desc: 'Weekly fresh + monthly staples with brands, prices, WhatsApp share and PDF.',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-emerald-800" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.13 22.19L11.5 18.36L10.17 21.54L8.16 21.47L9.48 18.28L8.19 15.19L10.19 15.18L11.4 18.05L13.1 14L15.03 14.06L13.13 22.19ZM18 10H14V7H18V10ZM10 10H6V7H10V10ZM10 15H6V12H10V15ZM18 15H14V12H18V15ZM20 2H4C2.9 2 2 2.9 2 4V20C2 21.1 2.9 22 4 22H7.2L7.6 20H4V4H20V20H16.4L16.8 22H20C21.1 22 22 21.1 22 20V4C22 2.9 21.1 2 20 2Z" />
        </svg>
      ),
    },
    {
      title: 'Doctor chat + tracking',
      desc: 'Ask nutrition questions, log water & sleep, and watch weekly progress.',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-emerald-800" xmlns="http://www.w3.org/2000/svg">
          <path d="M17,8C15.35,8 13.94,8.87 13.17,10.17C12.4,8.87 10.94,8 9.27,8C6.91,8 5,9.91 5,12.27C5,15.6 8.05,18.36 12,21.35C15.95,18.36 19,15.6 19,12.27C19,9.91 17.09,8 17,8Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-mesh overflow-x-hidden selection:bg-amber-400 selection:text-emerald-950 text-emerald-950">
      <nav className="fixed top-0 w-full z-50 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3 bg-white/30 backdrop-blur-xl border border-white/40 rounded-full px-4 sm:px-6 py-3 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-emerald-900 rounded-lg flex items-center justify-center shadow-inner shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-amber-400" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 9H9V2H7V9H5V2H3V9C3 11.12 4.66 12.84 6.75 12.97V22H8.25V12.97C10.34 12.84 12 11.12 12 9V2H10V9H11ZM16 6V14H18.5V22H20.5V2H16C16 4.21 17.79 6 20 6V6H16Z" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-emerald-900 truncate">MealDeal</span>
          </div>

          <a
            href="#features"
            className="hidden md:inline text-sm font-medium text-emerald-800/80 hover:text-emerald-950 transition-colors"
          >
            Features
          </a>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="/login"
              className="text-sm font-semibold text-emerald-900 px-3 sm:px-4 py-2 rounded-full hover:bg-emerald-900/5 transition-colors"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="clay-btn bg-emerald-900 text-amber-400 px-4 sm:px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:bg-emerald-800 inline-flex items-center"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 px-6">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] right-[10%] w-64 h-64 bg-amber-400/20 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-[10%] left-[5%] w-96 h-96 bg-emerald-900/10 rounded-full blur-[100px] animate-float" />
          <div
            className="absolute top-[25%] left-[15%] w-24 h-24 bg-white/40 backdrop-blur-md rounded-3xl shadow-2xl border border-white/60 rotate-12 animate-float hidden sm:block"
            style={{ animationDelay: '1s' }}
          />
          <div
            className="absolute bottom-[30%] right-[15%] w-32 h-32 bg-amber-100/30 backdrop-blur-md rounded-full shadow-2xl border border-white/60 animate-float-slow hidden sm:block"
            style={{ animationDelay: '2s' }}
          />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto animate-hero-reveal">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/5 border border-emerald-900/10 text-emerald-900 text-xs font-bold uppercase tracking-widest mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            Personalized nutrition, planned for you
          </div>

          <h1 className="font-display text-6xl sm:text-7xl md:text-9xl font-black text-emerald-950 leading-[0.9] mb-6 tracking-tighter animate-breath">
            MealDeal<span className="text-amber-500">.</span>
          </h1>

          <p className="font-display text-xl sm:text-2xl md:text-4xl text-emerald-900/90 leading-tight mb-4 max-w-2xl mx-auto font-medium italic">
            Eat better. Live brighter.
          </p>

          <p className="text-base sm:text-lg md:text-xl text-emerald-800/70 mb-10 max-w-xl mx-auto leading-relaxed">
            Meal plans, grocery lists, recipes, and health tracking — in one calm place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/register"
              className="clay-btn group relative px-8 sm:px-10 py-4 sm:py-5 bg-amber-400 text-emerald-950 rounded-2xl font-bold text-lg inline-flex items-center gap-3 overflow-hidden shadow-[0_20px_50px_rgba(251,191,36,0.3)]"
            >
              <span className="relative z-10">Start free</span>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 relative z-10">
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                  clipRule="evenodd"
                />
              </svg>
            </a>

            <a
              href="#features"
              className="px-8 py-4 sm:py-5 text-emerald-900 font-bold hover:bg-emerald-900/5 rounded-2xl transition-colors"
            >
              See features
            </a>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-40 pointer-events-none">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-emerald-900">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </section>

      <section id="features" className="py-24 sm:py-32 px-6 bg-white/20 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-emerald-950 mb-3">
              Built for real routines
            </h2>
            <p className="text-emerald-800/70 max-w-xl mx-auto">
              Plan, shop, cook, check in — without spreadsheet chaos.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="clay-card p-8 sm:p-10 group hover:-translate-y-2 transition-transform duration-500"
              >
                <div className="w-16 h-16 bg-emerald-900/5 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="font-display text-2xl font-bold text-emerald-950 mb-4">{feature.title}</h3>
                <p className="text-emerald-800/60 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-sm text-emerald-800/50">
        MealDeal · Personalized nutrition
      </footer>
    </div>
  );
}
