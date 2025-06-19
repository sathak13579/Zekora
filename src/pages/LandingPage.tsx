import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Zap, Users, LineChart, Trophy, Check, Sparkles, Play, Star, ChevronDown } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

const LandingPage = () => {
  const [demoPin] = useState('000000');
  const [currentFeature, setCurrentFeature] = useState(0);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const features = [
    {
      icon: Brain,
      title: "AI-Generated Questions",
      description: "Turn any text, PDF, or video into engaging multiple-choice questions with explanations.",
      color: "from-purple-500 to-indigo-600"
    },
    {
      icon: Zap,
      title: "Real-time Interaction",
      description: "Host live quizzes with real-time updates, timers, and instant feedback.",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: Users,
      title: "Easy Participation",
      description: "Players join with a simple code, no downloads or accounts required.",
      color: "from-green-400 to-blue-500"
    },
    {
      icon: LineChart,
      title: "Detailed Analytics",
      description: "Track performance with comprehensive reports and visualizations.",
      color: "from-pink-500 to-red-500"
    },
    {
      icon: Trophy,
      title: "Leaderboards",
      description: "Boost engagement with competitive leaderboards updated in real-time.",
      color: "from-indigo-500 to-purple-600"
    },
    {
      icon: Check,
      title: "Easy to Use",
      description: "Intuitive interface designed for both hosts and participants of all ages.",
      color: "from-teal-400 to-cyan-500"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section with Parallax */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            style={{ y }}
            className="absolute inset-0"
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </motion.div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-lg"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium">Where Knowledge Ignites</span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl"
              >
                Create{' '}
                <motion.span
                  className="relative inline-block"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600">
                    AI-powered
                  </span>
                  <motion.div
                    className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-lg blur opacity-30"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                </motion.span>{' '}
                quizzes in seconds
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="mt-6 text-xl leading-relaxed text-gray-300"
              >
                Upload any content and Zekora! creates engaging live quizzes with multiple-choice questions, real-time leaderboards, and detailed analytics.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    to="/join" 
                    className="group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-8 py-4 text-lg font-semibold text-black shadow-lg transition-all hover:shadow-xl hover:shadow-yellow-500/25"
                  >
                    <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                    Join Quiz
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    to={`/play/${demoPin}`} 
                    className="group inline-flex items-center justify-center rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/20"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Try Demo
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: 45 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
              className="relative mx-auto max-w-md lg:max-w-full"
            >
              <div className="relative">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute -inset-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-full blur-xl opacity-30"
                />
                <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                  <img
                    src="https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"
                    alt="Zekora! in action"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center text-white/60"
          >
            <span className="text-sm mb-2">Scroll to explore</span>
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.div>
      </section>

      {/* Interactive Features Showcase */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white sm:text-5xl mb-6">
              Why choose{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                Zekora!
              </span>
              ?
            </h2>
            <p className="text-xl text-gray-300">
              Experience the future of interactive learning with our cutting-edge features.
            </p>
          </motion.div>

          {/* Feature Carousel */}
          <div className="relative max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Feature Display */}
              <motion.div
                key={currentFeature}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-8">
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${features[currentFeature].color} opacity-10`}
                    animate={{
                      opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                  <div className="relative z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${features[currentFeature].color} mb-6`}
                    >
                      <features[currentFeature].icon className="h-8 w-8 text-white" />
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl font-bold text-white mb-4"
                    >
                      {features[currentFeature].title}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-gray-300 text-lg leading-relaxed"
                    >
                      {features[currentFeature].description}
                    </motion.p>
                  </div>
                </div>
              </motion.div>

              {/* Feature Grid */}
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                    viewport={{ once: true }}
                    className={`relative cursor-pointer rounded-xl p-4 transition-all duration-300 ${
                      index === currentFeature
                        ? 'bg-white/20 border-2 border-white/40 scale-105'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => setCurrentFeature(index)}
                    whileHover={{ scale: index === currentFeature ? 1.05 : 1.02 }}
                  >
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color} mb-3`}>
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">{feature.title}</h4>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works with Flow Animation */}
      <section className="py-24 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white sm:text-5xl mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-300">
              Create and host a live quiz in just three simple steps.
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            {/* Connection Lines */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent transform -translate-y-1/2" />
            
            <div className="grid gap-8 lg:grid-cols-3 relative">
              {[
                {
                  step: 1,
                  title: "Upload Content",
                  description: "Paste text, upload a PDF, or enter a video URL to generate questions.",
                  icon: "📄"
                },
                {
                  step: 2,
                  title: "Edit & Customize",
                  description: "Review AI-generated questions, make adjustments, and save your quiz.",
                  icon: "✏️"
                },
                {
                  step: 3,
                  title: "Host Live Quiz",
                  description: "Share the game pin with participants and start your interactive quiz.",
                  icon: "🚀"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.8, type: "spring", stiffness: 100 }}
                  viewport={{ once: true }}
                  className="relative text-center"
                >
                  {/* Step Number */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="relative mx-auto mb-6"
                  >
                    <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-2xl font-bold text-black shadow-lg">
                      {item.step}
                    </div>
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.5,
                      }}
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 blur-md"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: index * 0.2 + 0.3 }}
                    viewport={{ once: true }}
                    className="text-4xl mb-4"
                  >
                    {item.icon}
                  </motion.div>

                  <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{item.description}</p>

                  {/* Connection Arrow */}
                  {index < 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.2 + 0.5 }}
                      viewport={{ once: true }}
                      className="hidden lg:block absolute top-10 -right-4 text-purple-400"
                    >
                      <ArrowRight className="h-8 w-8" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Electric Effect */}
      <section className="relative py-24 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
        {/* Electric Background */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-px h-20 bg-gradient-to-b from-transparent via-yellow-400 to-transparent"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scaleY: [0, 1, 0],
              }}
              transition={{
                duration: 1 + Math.random(),
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.h2
              className="text-4xl font-bold text-white sm:text-5xl mb-6"
              whileInView={{ scale: [0.9, 1.05, 1] }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              Ready to ignite knowledge?
            </motion.h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of participants in interactive learning experiences.
            </p>
            <div className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to="/join" 
                  className="group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-8 py-4 text-lg font-semibold text-black shadow-lg transition-all hover:shadow-xl hover:shadow-yellow-500/25"
                >
                  <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                  Join Quiz Now
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to={`/play/${demoPin}`} 
                  className="group inline-flex items-center justify-center rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/20"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Try Demo
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;