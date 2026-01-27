import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Layout } from 'antd';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../Sidebar';
import { setMobile } from '@redux/slices/layoutSlice';
import { setCredentials } from '@redux/slices/authSlice';
import { storeAuth } from '@utils/auth.utils';
import { authService } from '@api';
import '@styles/layouts/MainLayout.scss';

const { Content } = Layout;

const MainLayout = ({ children }) => {
  const dispatch = useDispatch();
  const { sidebarCollapsed, isMobile } = useSelector((state) => state.layout);
  const { isAuthenticated, accessToken, refreshToken, idToken, user: currentUser } = useSelector((state) => state.auth);
  const fetchUserInfoInProgressRef = useRef(false);

  // Fetch user info from /auth/me on mount if authenticated
  useEffect(() => {
    const fetchUserInfo = async () => {
      // Prevent duplicate calls
      if (fetchUserInfoInProgressRef.current || !isAuthenticated || !accessToken) {
        return;
      }

      try {
        fetchUserInfoInProgressRef.current = true;
        const meResponse = await authService.getMe();
        
        // Handle response structure - API returns { success: true, data: {...} }
        let userData = null;
        if (meResponse) {
          if (meResponse.data && typeof meResponse.data === 'object') {
            userData = meResponse.data;
          } else if (meResponse.success && meResponse.data) {
            userData = meResponse.data;
          } else if (typeof meResponse === 'object' && meResponse.id) {
            userData = meResponse;
          }
        }

        // Update user info in Redux if we got valid data
        if (userData) {
          // Parse groups if it's a string (e.g., "[SuperAdmin]")
          let groupsArray = [];
          if (userData.groups) {
            if (Array.isArray(userData.groups)) {
              groupsArray = userData.groups;
            } else if (typeof userData.groups === 'string') {
              try {
                // Try to parse as JSON array string
                groupsArray = JSON.parse(userData.groups);
              } catch {
                // If not JSON, try to extract from string like "[SuperAdmin]"
                const match = userData.groups.match(/\[(.*?)\]/);
                if (match && match[1]) {
                  groupsArray = match[1].split(',').map(g => g.trim().replace(/['"]/g, ''));
                } else {
                  // Fallback: treat as single group
                  groupsArray = [userData.groups.trim()];
                }
              }
            }
          } else if (currentUser?.groups) {
            groupsArray = Array.isArray(currentUser.groups) ? currentUser.groups : [];
          }

          // Extract role from groups (first group) or use default
          const role = groupsArray.length > 0 ? groupsArray[0] : (userData.role || currentUser?.role || 'USER');
          
          // Use email as name if name is empty
          const displayName = userData.name && userData.name.trim() 
            ? userData.name 
            : (userData.email || currentUser?.email || currentUser?.name);

          const updatedUserInfo = {
            id: userData.id,
            email: userData.email || currentUser?.email,
            name: displayName,
            groups: groupsArray,
            status: userData.status || currentUser?.status,
            enabled: userData.enabled !== undefined ? userData.enabled : (currentUser?.enabled !== undefined ? currentUser.enabled : true),
            emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : currentUser?.emailVerified,
            createdAt: userData.createdAt || currentUser?.createdAt,
            lastModified: userData.lastModified || currentUser?.lastModified,
            role: role,
          };

          // Update Redux state with complete user info
          dispatch(setCredentials({
            accessToken,
            refreshToken,
            idToken,
            user: updatedUserInfo,
            role: updatedUserInfo.role,
          }));

          // Update stored auth with complete user info
          storeAuth({
            accessToken,
            refreshToken,
            idToken,
            user: updatedUserInfo,
            role: updatedUserInfo.role,
          });
        }
      } catch (error) {
        // If /auth/me fails, continue with existing user info
        console.warn('Failed to fetch user info from /auth/me:', error);
      } finally {
        fetchUserInfoInProgressRef.current = false;
      }
    };

    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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
