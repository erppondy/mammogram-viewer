export default function Footer() {
  // Use the base path from environment
  const basePath = import.meta.env.VITE_BASE_PATH || '/mammogram';

  return (
    <footer className="w-full py-1 px-4 border-t border-gray-700/30 mt-auto" style={{ background: '#000000' }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <img
            src={`${basePath}/cdcalogo.png`}
            alt="C-DAC Logo"
            className="h-20 w-20 object-contain"
          />
          <div className="text-xs text-gray-300">
            <p className="font-semibold text-white text-sm">Developed by</p>
            <p>Centre for Development of Advanced Computing (C-DAC)</p>
          </div>
        </div>
        <div className="text-xs text-gray-400 text-center md:text-right">
          <p>© {new Date().getFullYear()} Mammogram X-Ray Screener</p>
          <p>All rights reserved</p>
        </div>
      </div>
    </footer>
  );
}
