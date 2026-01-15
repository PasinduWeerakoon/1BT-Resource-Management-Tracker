import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Layout } from 'antd';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../Sidebar';
import { setMobile } from '@redux/slices/layoutSlice';
import '@styles/layouts/MainLayout.scss';

const { Content } = Layout;

const MainLayout = ({ children }) => {
  const dispatch = useDispatch();
  const { sidebarCollapsed, isMobile } = useSelector((state) => state.layout);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      dispatch(setMobile(mobile));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  return (
    <Layout className="main-layout">
      <Sidebar />
      <Layout
        className={`main-layout-content ${sidebarCollapsed ? 'collapsed' : 'expanded'}`}
      >
        <Header />
        <Content className="main-layout-body">{children}</Content>
        <Footer />
      </Layout>
    </Layout>
  );
};

export default MainLayout;
