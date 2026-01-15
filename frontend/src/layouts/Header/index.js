import React from 'react';
import { useSelector } from 'react-redux';
import { Layout } from 'antd';
import '@styles/layouts/Header.scss';

const { Header: AntHeader } = Layout;

const Header = () => {
  const { sidebarCollapsed, isMobile } = useSelector((state) => state.layout);

  return (
    <AntHeader 
      className="app-header"
      style={{
        left: isMobile ? 0 : (sidebarCollapsed ? 80 : 250),
      }}
    >
      <div className="header-content">
        <div className="header-left">
          <div className="header-logo">
            <div className="company-name">1billion TECHNOLOGY</div>
            <div className="system-name">RESOURCE MANAGEMENT TRACKER</div>
          </div>
        </div>
      </div>
    </AntHeader>
  );
};

export default Header;
