import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Zap, Users, LineChart, Trophy, Check, Sparkles, Bolt, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const [demoPin] = useState('000000');

  return (
    <div className="flex flex-col bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden lightning-bg py-16 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-lg"
            >
              <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Bolt className="mr-2 h-4 w-4" />
                A flash of insight from the core of knowledge
              </div>
              <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent animate-electric-pulse">AI-powered</span> quizzes in seconds
              </h1>
              <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
                Upload any content and Zekora! creates engaging live quizzes with multiple-choice questions, real-time leaderboards, and detailed analytics.
              </p>
              <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Link 
                  to="/join" 
                  className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-primary to-accent px-6 py-3 text-base font-medium text-black shadow-md transition-all hover:opacity-90 electric-glow"
                >
                  Join Quiz
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  to={`/play/${demoPin}`} 
                  className="inline-flex items-center justify-center rounded-md border border-primary bg-transparent px-6 py-3 text-base font-medium text-primary shadow-sm transition-colors hover:bg-primary/10"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  Try Demo
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative mx-auto max-w-md lg:max-w-full"
            >
              <div className="overflow-hidden rounded-lg shadow-2xl border border-border electric-glow">
                <img
                  src="https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"
                  alt="Zekora! in action - Electric knowledge visualization"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -top-4 -right-4 h-8 w-8 rounded-full bg-gradient-to-r from-primary to-accent animate-lightning" />
              <div className="absolute -bottom-4 -left-4 h-6 w-6 rounded-full bg-accent animate-pulse" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Why choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Zekora!</span>?
              </h2>
              <p className="mt-4 text-xl text-muted-foreground">
                Create, host, and analyze interactive quizzes with powerful AI assistance.
              </p>
            </motion.div>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-lg transition-all hover:border-primary/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/20">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">AI-Generated Questions</h3>
              <p className="mt-2 text-muted-foreground">
                Turn any text, PDF, or video into engaging multiple-choice questions with explanations.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-lg transition-all hover:border-accent/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accent/20">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">Real-time Interaction</h3>
              <p className="mt-2 text-muted-foreground">
                Host live quizzes with real-time updates, timers, and instant feedback.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-lg transition-all hover:border-primary/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">Easy Participation</h3>
              <p className="mt-2 text-muted-foreground">
                Players join with a simple code, no downloads or accounts required.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-lg transition-all hover:border-accent/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accent/20">
                <LineChart className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">Detailed Analytics</h3>
              <p className="mt-2 text-muted-foreground">
                Track performance with comprehensive reports and visualizations.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-lg transition-all hover:border-primary/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/20">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">Leaderboards</h3>
              <p className="mt-2 text-muted-foreground">
                Boost engagement with competitive leaderboards updated in real-time.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-lg transition-all hover:border-accent/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accent/20">
                <Check className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">Easy to Use</h3>
              <p className="mt-2 text-muted-foreground">
                Intuitive interface designed for both hosts and participants of all ages.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-xl text-muted-foreground">
              Create and host a live quiz in just three simple steps.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent text-2xl font-bold text-black electric-glow">1</div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">Upload Content</h3>
              <p className="mt-2 text-muted-foreground">
                Paste text, upload a PDF, or enter a video URL to generate questions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent text-2xl font-bold text-black electric-glow">2</div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">Edit & Customize</h3>
              <p className="mt-2 text-muted-foreground">
                Review AI-generated questions, make adjustments, and save your quiz.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent text-2xl font-bold text-black electric-glow">3</div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">Host Live Quiz</h3>
              <p className="mt-2 text-muted-foreground">
                Share the game pin with participants and start your interactive quiz.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-accent py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-black sm:text-4xl">
              Ready to ignite knowledge?
            </h2>
            <p className="mt-4 text-xl text-black/80">
              Join thousands of participants in interactive learning experiences.
            </p>
            <div className="mt-8 flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link 
                to="/join" 
                className="inline-flex items-center justify-center rounded-md bg-black px-6 py-3 text-base font-medium text-white shadow-md transition-colors hover:bg-black/90"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Join Quiz Now
              </Link>
              <Link 
                to={`/play/${demoPin}`} 
                className="inline-flex items-center justify-center rounded-md border border-black bg-transparent px-6 py-3 text-base font-medium text-black shadow-sm transition-colors hover:bg-black/10"
              >
                <Eye className="mr-2 h-5 w-5" />
                Try Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;