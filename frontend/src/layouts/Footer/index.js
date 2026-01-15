import React from 'react';
import { useSelector } from 'react-redux';
import { Layout } from 'antd';
import '@styles/layouts/Footer.scss';

const { Footer: AntFooter } = Layout;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { sidebarCollapsed, isMobile } = useSelector((state) => state.layout);

  return (
    <AntFooter 
      className="app-footer"
      style={{
        left: isMobile ? 0 : (sidebarCollapsed ? 80 : 250),
      }}
    >
      <div className="footer-content">
        <p>© {currentYear} 1billiontech. All rights reserved.</p>
      </div>
    </AntFooter>
  );
};

export default Footer;
