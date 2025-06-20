import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t bg-white py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Logo and Brand */}
          <div className="mb-2">
            <Link to="/" className="flex items-center space-x-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
                <Sparkles className="h-5 w-5 text-white" />
                <div className="absolute -right-1 -top-1">
                  <div className="h-2 w-2 animate-spark rounded-full bg-yellow-300" />
                </div>
              </div>
              <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                Zekora!
              </span>
            </Link>
          </div>
          
          {/* Tagline */}
          <p className="text-sm text-gray-600 max-w-md mb-2 leading-relaxed">
            Where Knowledge Ignites! AI-powered live quiz platform for educators and presenters.
          </p>
        </div>
        
        {/* Copyright */}
        <div className="border-t pt-2">
          <p className="text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Zekora! All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;