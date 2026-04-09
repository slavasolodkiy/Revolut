import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Shield, Zap, LineChart } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <header className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">N</span>
          </div>
          <span className="font-bold text-xl tracking-tight">NovaPay</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#global" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Global</a>
          <a href="#security" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Security</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Log In</Link>
          <Link href="/register">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Open Account
            </Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10"></div>
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border mb-8 backdrop-blur-sm">
              <span className="flex w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-xs font-medium">NovaPay Business is now live in 40+ countries</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              The financial <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">command center</span><br className="hidden md:block"/> for global power users.
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Manage multiple currencies, track granular spending analytics, and move money across borders with zero friction. Built for those who demand more from their money.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-primary hover:bg-primary/90">
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 px-6 bg-secondary/30 border-y border-border">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Precision engineered for your wealth</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">We stripped away the clutter to give you a dense, information-rich interface that respects your intelligence.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Multi-currency Accounts</h3>
                <p className="text-muted-foreground leading-relaxed">Hold, exchange, and send over 30 currencies with real-time interbank exchange rates. No hidden markups.</p>
              </div>
              <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Instant Transfers</h3>
                <p className="text-muted-foreground leading-relaxed">Send money instantly to other NovaPay users globally. Execute SEPA and SWIFT transfers with unprecedented speed.</p>
              </div>
              <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <LineChart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Granular Analytics</h3>
                <p className="text-muted-foreground leading-relaxed">Deep-dive into your spending patterns with automatic categorization, custom tags, and trend forecasting.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-6 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to take control?</h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">Join thousands of power users who have upgraded their financial infrastructure to NovaPay.</p>
            <Link href="/register">
              <Button size="lg" className="text-lg h-14 px-10 bg-foreground text-background hover:bg-foreground/90">
                Create Your Account Now
              </Button>
            </Link>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
        </section>
      </main>

      <footer className="border-t border-border py-12 px-6 bg-secondary/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-xs">N</span>
            </div>
            <span className="font-bold tracking-tight">NovaPay © 2025</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Legal</a>
            <a href="#" className="hover:text-foreground">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}