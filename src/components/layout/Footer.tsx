import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t bg-white py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo, Brand, and Tagline */}
          <div className="flex items-center space-x-4">
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
            <span className="hidden sm:block text-sm text-gray-600">
              Where Knowledge Ignites!
            </span>
          </div>
          
          {/* Right Side - Copyright */}
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Zekora! All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;