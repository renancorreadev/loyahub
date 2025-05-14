import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  [key: string]: any;
}

const Layout: React.FC<LayoutProps> = ({ children, ...props }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white" {...props}>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
