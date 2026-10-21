import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Button, Tooltip, App } from 'antd';
import { LogoutOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined, TeamOutlined, UserOutlined, HistoryOutlined } from '@ant-design/icons';
import { logoutUser } from '@redux/slices/authSlice';
import { toggleSidebar } from '@redux/slices/layoutSlice';
import { getMenuItems } from '@navigation/menuItems';
import { parseGroups } from '@pages/Auth/Login/utils/authHelpers';
import '@styles/layouts/Sidebar.scss';

const { Sider } = Layout;

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, isMobile } = useSelector((state) => state.layout);
  const { user, role } = useSelector((state) => state.auth);
  const { message } = App.useApp();

  const menuItems = getMenuItems(role);

  const handleMenuClick = ({ key }) => {
    navigate(key);
    if (isMobile) {
      dispatch(toggleSidebar());
    }
  };

  const handleCollapse = (collapsed) => {
    dispatch(toggleSidebar());
  };

  const handleLogout = async () => {
    try {
      // Call logout API and clear state
      await dispatch(logoutUser()).unwrap();
      message.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      // Even if API call fails, we still logout locally
      message.warning('Logged out locally');
      navigate('/login', { replace: true });
    }
  };

  // Get user initials for avatar
  const getInitials = (user) => {
    if (!user) return 'U';

    // Try to get name from various fields
    const name = user.name || user.given_name || user.preferred_username || user.email || '';

    if (!name) return 'U';

    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Format user display name: "name | email" or just "email" if no name
  const getUserDisplayName = () => {
    const name = user?.name?.trim();
    const email = user?.email || user?.username || '';

    if (name && name !== email) {
      return `${name} | ${email}`;
    }
    return email || 'User';
  };

  // Check if user has Admin role in groups
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const groups = parseGroups(user.groups);
    return groups.some(group => group === 'Admin' || group === 'SuperAdmin');
  }, [user]);

  const userMenuItems = useMemo(() => {
    const items = [
      {
        key: 'user-info',
        label: (
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{getUserDisplayName()}</div>
            <div className="sidebar-user-email">{role || 'User'}</div>
          </div>
        ),
        disabled: true,
      },
      {
        type: 'divider',
      },
      {
        key: 'employee-management',
        label: 'Employee Management',
        icon: <TeamOutlined />,
        onClick: () => {
          navigate('/resources');
          if (isMobile) {
            dispatch(toggleSidebar());
          }
        },
      },
    ];

    // Only show System Users if user is Admin
    if (isAdmin) {
      items.push({
        key: 'system-users',
        label: 'System Users',
        icon: <UserOutlined />,
        onClick: () => {
          navigate('/system-users');
          if (isMobile) {
            dispatch(toggleSidebar());
          }
        },
      });
    }

    items.push({
      type: 'divider',
    });

    // Only show Configurations and Activity Log if user is Admin
    if (isAdmin) {
      items.push(
        {
          key: 'configurations',
          label: 'Configurations',
          icon: <SettingOutlined />,
          onClick: () => {
            navigate('/configurations');
            if (isMobile) {
              dispatch(toggleSidebar());
            }
          },
        },
        {
          key: 'activity-log',
          label: 'Activity Log',
          icon: <HistoryOutlined />,
          onClick: () => {
            navigate('/activity-log');
            if (isMobile) {
              dispatch(toggleSidebar());
            }
          },
        }
      );
    }

    items.push(
      {
        key: 'settings',
        label: 'Settings',
        icon: <SettingOutlined />,
        onClick: () => {
          navigate('/settings');
          if (isMobile) {
            dispatch(toggleSidebar());
          }
        },
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        label: 'Logout',
        icon: <LogoutOutlined />,
        onClick: handleLogout,
        danger: true,
      }
    );

    return items;
  }, [user, role, isAdmin, isMobile, navigate, dispatch, handleLogout]);

  return (
    <Sider
      className="app-sidebar"
      collapsible
      collapsed={sidebarCollapsed}
      onCollapse={handleCollapse}
      trigger={null}
      breakpoint="lg"
      collapsedWidth={isMobile ? 0 : 80}
      width={250}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="sidebar-content">
        <div className={`sidebar-header ${sidebarCollapsed ? 'collapsed' : 'expanded'}`}>
          <Tooltip
            title={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
            placement={sidebarCollapsed ? "right" : "bottom"}
          >
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={handleCollapse}
              className="sidebar-toggle-btn"
            />
          </Tooltip>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />

        <div className="sidebar-footer">
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="topLeft"
            trigger={['click']}
            overlayClassName="sidebar-user-menu"
          >
            <div className="sidebar-user-profile">
              <Avatar
                size={sidebarCollapsed ? 28 : 32}
                style={{
                  backgroundColor: '#001529',
                  color: '#fff',
                  fontFamily: 'Poppins',
                  fontWeight: 600,
                  fontSize: sidebarCollapsed ? '11px' : '13px',
                  flexShrink: 0,
                }}
              >
                {getInitials(user)}
              </Avatar>
              {!sidebarCollapsed && (
                <div className="sidebar-user-details">
                  <div className="sidebar-user-name-text">
                    {user?.name || user?.given_name || user?.preferred_username || user?.email || 'User'}
                  </div>
                  <div className="sidebar-user-role-text">
                    {role || 'User'}
                  </div>
                </div>
              )}
            </div>
          </Dropdown>
        </div>
      </div>
    </Sider>
  );
};

export default Sidebar;
