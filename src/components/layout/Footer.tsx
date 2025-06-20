import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <footer className="border-t bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Logo and Brand with Floating Animation */}
          <motion.div
            animate={{ 
              y: [0, -8, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-6"
          >
            <Link to="/" className="flex items-center space-x-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                <Sparkles className="h-7 w-7 text-white" />
                <div className="absolute -right-1 -top-1">
                  <div className="h-3 w-3 animate-spark rounded-full bg-yellow-300" />
                </div>
              </div>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                Zekora!
              </span>
            </Link>
          </motion.div>
          
          {/* Elegant Tagline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-xs mb-12 leading-relaxed"
          >
            Where Knowledge Ignites! AI-powered live quiz platform for educators and presenters.
          </motion.p>
        </div>
        
        {/* Copyright */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t pt-8"
        >
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Zekora! All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;