import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const PolycabPromoButton = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800"
    >
      <div className="container mx-auto px-4 py-3">
        <Link
          to="/category/wires-&-cables?brands=Polycab&family=Polycab"
          className="flex items-center justify-center gap-3 group"
        >
          <div className="flex items-center gap-3 text-white">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-semibold text-sm sm:text-base">
                Polycab Wires & Cables
              </span>
              <span className="text-xs sm:text-sm text-blue-100">
                • Up to 60% OFF • Premium Quality
              </span>
            </div>
          </div>
          <ArrowRight 
            className="h-5 w-5 text-white transition-transform group-hover:translate-x-1" 
            strokeWidth={2}
          />
        </Link>
      </div>
    </motion.div>
  );
};

export default PolycabPromoButton;

