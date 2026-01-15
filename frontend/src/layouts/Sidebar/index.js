import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Button, Tooltip } from 'antd';
import { LogoutOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined, TeamOutlined } from '@ant-design/icons';
import { logout } from '@redux/slices/authSlice';
import { toggleSidebar } from '@redux/slices/layoutSlice';
import { getMenuItems } from '@navigation/menuItems';
import '@styles/layouts/Sidebar.scss';

const { Sider } = Layout;

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, isMobile } = useSelector((state) => state.layout);
  const { user, role } = useSelector((state) => state.auth);

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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userMenuItems = [
    {
      key: 'user-info',
      label: (
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name || 'User'}</div>
          <div className="sidebar-user-email">{user?.email || user?.username || ''}</div>
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
    {
      type: 'divider',
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
      onClick: () => {
        // Navigate to settings if needed
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
    },
  ];

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
                {getInitials(user?.name)}
              </Avatar>
              {!sidebarCollapsed && (
                <div className="sidebar-user-details">
                  <div className="sidebar-user-name-text">
                    {user?.name || 'User'}
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
