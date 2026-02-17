import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Layout } from 'antd';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../Sidebar';
import { setMobile } from '@redux/slices/layoutSlice';
import { setCredentials } from '@redux/slices/authSlice';
import { fetchAllConfigData, selectTiers, selectTracks, selectProjectTypes, selectBillingStatuses, selectTags, selectDesignations, selectTechStacks, selectUniversities, selectEmployeeTypes } from '@redux/slices/configSlice';
import { storeAuth } from '@utils/auth.utils';
import { authService } from '@api';
import logger from '@utils/logger';
import '@styles/layouts/MainLayout.scss';

const { Content } = Layout;

const MainLayout = ({ children }) => {
  const dispatch = useDispatch();
  const { sidebarCollapsed, isMobile } = useSelector((state) => state.layout);
  const { isAuthenticated, accessToken, refreshToken, idToken, user: currentUser } = useSelector((state) => state.auth);
  const tiers = useSelector(selectTiers);
  const tracks = useSelector(selectTracks);
  const projectTypes = useSelector(selectProjectTypes);
  const billingStatuses = useSelector(selectBillingStatuses);
  const tags = useSelector(selectTags);
  const designations = useSelector(selectDesignations);
  const techStacks = useSelector(selectTechStacks);
  const universities = useSelector(selectUniversities);
  const employeeTypes = useSelector(selectEmployeeTypes);
  const fetchUserInfoInProgressRef = useRef(false);
  const fetchConfigDataInProgressRef = useRef(false);

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
        logger.warn('Failed to fetch user info from /auth/me', error);
      } finally {
        fetchUserInfoInProgressRef.current = false;
      }
    };

    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Fetch configuration data on mount if authenticated and data not loaded
  useEffect(() => {
    const fetchConfigData = async () => {
      // Prevent duplicate calls
      if (fetchConfigDataInProgressRef.current || !isAuthenticated || !accessToken) {
        return;
      }

      // Check if any config data is missing (if all are loaded, no need to fetch)
      const hasTiers = tiers && tiers.length > 0;
      const hasTracks = tracks && tracks.length > 0;
      const hasProjectTypes = projectTypes && projectTypes.length > 0;
      const hasBillingStatuses = billingStatuses && billingStatuses.length > 0;
      const hasTags = tags && tags.length > 0;
      const hasDesignations = designations && designations.length > 0;
      const hasTechStacks = techStacks && techStacks.length > 0;
      const hasUniversities = universities && universities.length > 0;
      const hasEmployeeTypes = employeeTypes && employeeTypes.length > 0;

      // Only fetch if at least one is missing (since we fetch all in one call)
      if (hasTiers && hasTracks && hasProjectTypes && hasBillingStatuses && 
          hasTags && hasDesignations && hasTechStacks && hasUniversities && hasEmployeeTypes) {
        return;
      }

      try {
        fetchConfigDataInProgressRef.current = true;
        await dispatch(fetchAllConfigData()).unwrap();
        logger.debug('Configuration data fetched successfully on app initialization');
      } catch (error) {
        logger.warn('Failed to fetch configuration data on app initialization:', error);
      } finally {
        fetchConfigDataInProgressRef.current = false;
      }
    };

    fetchConfigData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken, tiers.length, tracks.length, projectTypes.length, billingStatuses.length, tags.length, designations.length, techStacks.length, universities.length, employeeTypes.length]); // Run when auth state changes or configs are missing

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
