import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Zap, Users, LineChart, Trophy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const [demoPin] = useState('000000');

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-blue-50 py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-lg"
            >
              <h1 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">AI-powered</span> quizzes in seconds
              </h1>
              <p className="mt-6 text-xl leading-relaxed text-gray-600">
                Upload any content and Zekora! creates engaging live quizzes with multiple-choice questions, real-time leaderboards, and detailed analytics.
              </p>
              <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Link 
                  to="/join" 
                  className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-base font-medium text-white shadow-md transition-colors hover:opacity-90"
                >
                  Join Quiz
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  to={`/play/${demoPin}`} 
                  className="inline-flex items-center justify-center rounded-md border border-indigo-600 bg-white px-6 py-3 text-base font-medium text-indigo-600 shadow-sm transition-colors hover:bg-indigo-50"
                >
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
              <div className="overflow-hidden rounded-lg shadow-xl">
                <img
                  src="https://images.pexels.com/photos/8636597/pexels-photo-8636597.jpeg"
                  alt="Zekora! in action"
                  className="h-full w-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Why choose Zekora!?
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Create, host, and analyze interactive quizzes with powerful AI assistance.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-indigo-100">
                <Brain className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">AI-Generated Questions</h3>
              <p className="mt-2 text-gray-600">
                Turn any text, PDF, or video into engaging multiple-choice questions with explanations.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-purple-100">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Real-time Interaction</h3>
              <p className="mt-2 text-gray-600">
                Host live quizzes with real-time updates, timers, and instant feedback.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-indigo-100">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Easy Participation</h3>
              <p className="mt-2 text-gray-600">
                Players join with a simple code, no downloads or accounts required.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-purple-100">
                <LineChart className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Detailed Analytics</h3>
              <p className="mt-2 text-gray-600">
                Track performance with comprehensive reports and visualizations.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-indigo-100">
                <Trophy className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Leaderboards</h3>
              <p className="mt-2 text-gray-600">
                Boost engagement with competitive leaderboards updated in real-time.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-purple-100">
                <Check className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Easy to Use</h3>
              <p className="mt-2 text-gray-600">
                Intuitive interface designed for both hosts and participants of all ages.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-xl text-gray-600">
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
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-2xl font-bold text-white">1</div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">Upload Content</h3>
              <p className="mt-2 text-gray-600">
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
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-2xl font-bold text-white">2</div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">Edit & Customize</h3>
              <p className="mt-2 text-gray-600">
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
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-2xl font-bold text-white">3</div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">Host Live Quiz</h3>
              <p className="mt-2 text-gray-600">
                Share the game pin with participants and start your interactive quiz.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-500 to-purple-600 py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to join a quiz?
            </h2>
            <p className="mt-4 text-xl text-indigo-100">
              Join thousands of participants in interactive learning experiences.
            </p>
            <div className="mt-8 flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link 
                to="/join" 
                className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-base font-medium text-indigo-600 shadow-md transition-colors hover:bg-gray-100"
              >
                Join Quiz Now
              </Link>
              <Link 
                to={`/play/${demoPin}`} 
                className="inline-flex items-center justify-center rounded-md border border-white bg-transparent px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-white/10"
              >
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