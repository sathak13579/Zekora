import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, Zap, Users, Play, Sparkles, Timer, Trophy, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const [gamePin, setGamePin] = useState('');
  const [nickname, setNickname] = useState('');
  const navigate = useNavigate();

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (gamePin.trim() && nickname.trim()) {
      navigate(`/play/${gamePin.trim()}?nickname=${encodeURIComponent(nickname.trim())}`);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section - Focused on Players */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            {/* Left Side - Join Quiz */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <div className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 px-4 py-2 text-sm font-medium text-indigo-700 mb-6">
                <Sparkles className="mr-2 h-4 w-4" />
                AI-Powered Quiz Platform
              </div>
              
              <h1 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl mb-6">
                Join a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Live Quiz</span> in Seconds
              </h1>
              
              <p className="text-xl leading-relaxed text-gray-600 mb-8">
                Enter a game PIN and your nickname to join interactive quizzes with real-time competition and AI-generated questions.
              </p>

              {/* Quick Join Form */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Play className="mr-2 h-5 w-5 text-indigo-600" />
                  Quick Join
                </h3>
                <form onSubmit={handleQuickJoin} className="space-y-4">
                  <div>
                    <label htmlFor="gamePin" className="block text-sm font-medium text-gray-700 mb-2">
                      Game PIN
                    </label>
                    <input
                      type="text"
                      id="gamePin"
                      value={gamePin}
                      onChange={(e) => setGamePin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit PIN"
                      className="w-full px-4 py-3 text-center text-xl font-bold tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Nickname
                    </label>
                    <input
                      type="text"
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value.slice(0, 15))}
                      placeholder="Choose a fun nickname"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      maxLength={15}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!gamePin.trim() || !nickname.trim()}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Join Quiz Now
                  </button>
                </form>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/join" 
                  className="inline-flex items-center justify-center rounded-lg border-2 border-indigo-600 bg-white px-6 py-3 text-base font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  Need Help Joining?
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link 
                  to="/register" 
                  className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Create Your Own Quiz
                </Link>
              </div>
            </motion.div>

            {/* Right Side - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 lg:order-2 relative"
            >
              <div className="relative">
                {/* Main Image */}
                <div className="overflow-hidden rounded-2xl shadow-2xl">
                  <img
                    src="https://images.pexels.com/photos/8636597/pexels-photo-8636597.jpeg"
                    alt="Students participating in interactive quiz"
                    className="h-full w-full object-cover"
                  />
                </div>
                
                {/* Floating Elements */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100"
                >
                  <div className="flex items-center space-x-2">
                    <Brain className="h-6 w-6 text-indigo-600" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">AI Generated</div>
                      <div className="text-xs text-gray-500">Smart Questions</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100"
                >
                  <div className="flex items-center space-x-2">
                    <Users className="h-6 w-6 text-purple-600" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Live Competition</div>
                      <div className="text-xs text-gray-500">Real-time Results</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 px-6 py-3 text-sm font-medium text-indigo-700 mb-6"
            >
              <Brain className="mr-2 h-4 w-4" />
              Powered by Artificial Intelligence
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4"
            >
              Experience the Future of Interactive Learning
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Our AI creates engaging questions from any content, making every quiz unique and educational.
            </motion.p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Brain className="h-16 w-16" />
              </div>
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white mb-6">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Question Generation</h3>
                <p className="text-gray-600">
                  Transform any text, video, or document into engaging multiple-choice questions with detailed explanations.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-8 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="h-16 w-16" />
              </div>
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white mb-6">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Interaction</h3>
                <p className="text-gray-600">
                  Join live quizzes with instant feedback, timers, and dynamic leaderboards that update in real-time.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-green-100 p-8 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target className="h-16 w-16" />
              </div>
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-white mb-6">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Scoring</h3>
                <p className="text-gray-600">
                  Advanced scoring system that rewards both accuracy and speed, making every second count.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How to Join Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4"
            >
              Join a Quiz in 3 Simple Steps
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600"
            >
              No downloads, no accounts required. Just join and play!
            </motion.p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-3xl font-bold text-white mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get the PIN</h3>
              <p className="text-gray-600">
                Your host will share a 6-digit game PIN. You can also find it displayed on their screen.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-3xl font-bold text-white mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Enter PIN & Nickname</h3>
              <p className="text-gray-600">
                Type the PIN and choose a fun nickname that other players will see on the leaderboard.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-3xl font-bold text-white mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Play & Compete</h3>
              <p className="text-gray-600">
                Answer questions, earn points, and climb the leaderboard in real-time competition!
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features for Players */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4"
            >
              Why Players Love Zekora!
            </motion.h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center p-6"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
                <Timer className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast-Paced</h3>
              <p className="text-gray-600 text-sm">
                Quick questions with timers keep the energy high and everyone engaged.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center p-6"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4">
                <Trophy className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Competitive</h3>
              <p className="text-gray-600 text-sm">
                Live leaderboards show your ranking and score in real-time.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center p-6"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600 mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Social</h3>
              <p className="text-gray-600 text-sm">
                Play with friends, classmates, or meet new people in group quizzes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center p-6"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <Brain className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Educational</h3>
              <p className="text-gray-600 text-sm">
                Learn while you play with AI-generated questions and explanations.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-white sm:text-4xl mb-4"
            >
              Ready to Join the Fun?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto"
            >
              Get your game PIN from your host and jump into an interactive quiz experience powered by AI.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link 
                to="/join" 
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-lg font-semibold text-indigo-600 shadow-lg hover:bg-gray-50 transition-colors"
              >
                <Play className="mr-2 h-5 w-5" />
                Join a Quiz
              </Link>
              <Link 
                to="/register" 
                className="inline-flex items-center justify-center rounded-lg border-2 border-white bg-transparent px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Create Your Own
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;