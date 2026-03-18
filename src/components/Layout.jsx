import React from 'react';

const Layout = ({ children, className = "" }) => {
  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 selection:bg-red-500/30 ${className}`}>
      {children}
    </div>
  );
};

export default Layout;