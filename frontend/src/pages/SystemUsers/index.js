import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Form, Input, Select, Space, Tooltip, Modal, Row, Col } from 'antd';
import { EditOutlined, UserAddOutlined } from '@ant-design/icons';
import CustomModal from '@components/Modal';
import CustomTable from '@components/Table';
import { authService, resourcesService } from '@api';
import { showErrorToast, showSuccessToast } from '@utils/toast.utils';
import logger from '@utils/logger';
import '@styles/pages/SystemUsers.scss';

const { Option } = Select;

const SystemUsers = () => {
  const [grantAccessForm] = Form.useForm();
  const [changeRoleForm] = Form.useForm();

  const [isGrantAccessModalVisible, setIsGrantAccessModalVisible] = useState(false);
  const [isChangeRoleModalVisible, setIsChangeRoleModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [revokeModalVisible, setRevokeModalVisible] = useState(false);
  const [userToRevoke, setUserToRevoke] = useState(null);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [resourcesList, setResourcesList] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [systemUsers, setSystemUsers] = useState([]);
  const [loadingSystemUsers, setLoadingSystemUsers] = useState(false);

  // Refs to prevent duplicate API calls
  const fetchInProgressRef = useRef(false);
  const fetchResourcesInProgressRef = useRef(false);
  const fetchSystemUsersInProgressRef = useRef(false);

  // Fetch resources from API
  const fetchResources = async () => {
    if (fetchResourcesInProgressRef.current) {
      return;
    }

    try {
      fetchResourcesInProgressRef.current = true;
      setLoadingResources(true);

      const response = await resourcesService.getAll({
        page: 1,
        limit: 100, // Fetch all resources for dropdown
        status: 'Active', // Only show active resources
      });

      // Handle response structure
      let resourcesData = [];
      if (response) {
        if (response.data && Array.isArray(response.data)) {
          resourcesData = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          resourcesData = response.data.data;
        } else if (Array.isArray(response)) {
          resourcesData = response;
        }
      }

      // Filter out resources without email
      const resourcesWithEmail = resourcesData.filter(resource => resource.email);
      setResourcesList(resourcesWithEmail);
    } catch (error) {
      logger.error('Failed to fetch resources:', error);
      showErrorToast('Failed to load resources');
    } finally {
      setLoadingResources(false);
      fetchResourcesInProgressRef.current = false;
    }
  };

  // Fetch system users from API
  const fetchSystemUsers = async () => {
    if (fetchSystemUsersInProgressRef.current) {
      return;
    }

    try {
      fetchSystemUsersInProgressRef.current = true;
      setLoadingSystemUsers(true);

      const response = await authService.getSystemUsers({
        limit: 100, // Fetch all users
      });

      // Handle response structure
      let usersData = [];
      if (response) {
        if (response.data && response.data.users && Array.isArray(response.data.users)) {
          usersData = response.data.users;
        } else if (response.users && Array.isArray(response.users)) {
          usersData = response.users;
        } else if (Array.isArray(response)) {
          usersData = response;
        }
      }

      // Map API response to table format and enrich with resource data if available
      const mappedUsers = usersData.map((user) => {
        // Try to find matching resource by email to get additional info
        const matchingResource = resourcesList.find(
          (resource) => resource.email && resource.email.toLowerCase() === user.email?.toLowerCase()
        );

        return {
          key: user.id || user.email || user.username,
          id: user.id || user.email || user.username,
          email: user.email || user.username,
          employeeName: user.name || matchingResource?.name || matchingResource?.employee_name || user.email || 'N/A',
          username: user.username || user.email,
          userType: user.userType || 'User',
          status: user.status || 'Unknown',
          tier: matchingResource?.tier || null,
          employeeNumber: matchingResource?.employee_number || matchingResource?.employeeNumber || null,
          position: matchingResource?.position || matchingResource?.designation || null,
          groups: user.groups || [],
          enabled: user.enabled !== false,
          createdAt: user.createdAt,
          lastModified: user.lastModified,
        };
      });

      setSystemUsers(mappedUsers);
    } catch (error) {
      logger.error('Failed to fetch system users:', error);
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to load system users');
    } finally {
      setLoadingSystemUsers(false);
      fetchSystemUsersInProgressRef.current = false;
    }
  };

  // Fetch resources and system users on component mount
  useEffect(() => {
    fetchResources();
  }, []);

  // Fetch system users after resources are loaded (to match users with resources)
  useEffect(() => {
    if (resourcesList.length > 0 || fetchResourcesInProgressRef.current === false) {
      fetchSystemUsers();
    }
  }, [resourcesList]);

  // Handle Invite User
  const handleInviteUser = () => {
    grantAccessForm.resetFields();
    setSelectedResourceId(null);
    setIsGrantAccessModalVisible(true);
  };

  // Handle resource selection - auto-fill email
  const handleResourceSelect = (resourceId) => {
    setSelectedResourceId(resourceId);
    const selectedResource = resourcesList.find(r => r.id === resourceId);
    if (selectedResource) {
      // Store the resource ID in the form field (the Select value is the ID)
      grantAccessForm.setFieldsValue({
        name: resourceId, // Store ID, not name
        email: selectedResource.email || '',
      });
    }
  };

  // Handle resource clear - clear email
  const handleResourceClear = () => {
    setSelectedResourceId(null);
    grantAccessForm.setFieldsValue({
      name: undefined,
      email: undefined,
    });
  };

  const handleInviteSubmit = async () => {
    // Prevent duplicate calls
    if (fetchInProgressRef.current) {
      return;
    }

    try {
      const values = await grantAccessForm.validateFields();

      // Get resource details from selected resource ID
      // Use selectedResourceId state if available, otherwise fall back to form value
      const resourceId = selectedResourceId || values.name;

      if (!resourceId) {
        showErrorToast('Please select a user');
        return;
      }

      const selectedResource = resourcesList.find(r => r.id === resourceId);

      if (!selectedResource) {
        logger.error('Resource not found:', { resourceId, resourcesListLength: resourcesList.length });
        showErrorToast('Selected user not found. Please try selecting again.');
        return;
      }

      // Extract name and email from selected resource
      const userName = selectedResource.name || selectedResource.employee_name || '';
      const userEmail = selectedResource.email || values.email || '';
      const employeeId = selectedResource.id || selectedResource.employee_id;

      if (!userEmail) {
        showErrorToast('Selected user does not have an email address');
        return;
      }

      if (!employeeId) {
        showErrorToast('Selected user does not have an employee ID');
        return;
      }

      fetchInProgressRef.current = true;
      setIsSubmittingInvite(true);

      // Map role to API format (Admin|User)
      const apiRole = values.role === 'Admin' ? 'Admin' : 'User';

      // Call invite API - POST /api/v1/auth/invite
      // Payload: {email: string, name: string, role: "Admin"|"User", employee_id: string}
      const response = await authService.invite(
        userEmail,
        userName,
        apiRole,
        employeeId
      );

      // API returns: {success: true, message: "Invitation sent to email"}
      // If we reach here without an error, the API call succeeded
      // Check for success - handle various response structures
      const isSuccess = response && (
        response.success === true ||
        response.success === 'true' ||
        (response.data && (response.data.success === true || response.data.success === 'true')) ||
        // If response exists and has a message (and no explicit error), assume success
        (response.message && !response.error && !response.message.toLowerCase().includes('error') && !response.message.toLowerCase().includes('fail'))
      );

      // Since we're in the try block (not catch), the API call succeeded
      // Show appropriate message and close modal
      if (isSuccess || response) {
        const successMessage = response?.message || response?.data?.message || 'Invitation sent successfully';
        showSuccessToast(successMessage);
      } else {
        // This shouldn't happen if API succeeded, but handle it
        showErrorToast(response?.message || response?.data?.message || 'Failed to send invitation');
      }

      // Always close modal and reset form after successful API call (no error thrown)
      setIsGrantAccessModalVisible(false);
      grantAccessForm.resetFields();
      setSelectedResourceId(null);

      // Refresh system users list after successful invite
      await fetchSystemUsers();
    } catch (error) {
      logger.error('Failed to invite user:', error);
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to send invitation');
    } finally {
      setIsSubmittingInvite(false);
      fetchInProgressRef.current = false;
    }
  };

  // Handle Change Role
  const handleChangeRole = (record) => {
    setSelectedUser(record);
    changeRoleForm.setFieldsValue({
      userType: record.userType,
    });
    setIsChangeRoleModalVisible(true);
  };

  const handleChangeRoleSubmit = async () => {
    try {
      const values = await changeRoleForm.validateFields();
      const newUserType = values.userType;

      // Check if trying to change to Super Admin and one already exists
      if (newUserType === 'Super Admin') {
        const existingSuperAdmin = systemUsers.find(user => user.userType === 'Super Admin' && user.key !== selectedUser.key);
        if (existingSuperAdmin) {
          Modal.error({
            title: 'Cannot Change Role',
            content: 'Only one Super Admin can exist in the system. Please change the existing Super Admin first.',
          });
          return;
        }
      }

      setSystemUsers(systemUsers.map(user =>
        user.key === selectedUser.key ? { ...user, userType: newUserType } : user
      ));

      setIsChangeRoleModalVisible(false);
      changeRoleForm.resetFields();
      setSelectedUser(null);
    } catch (error) {
      logger.error('Validation failed:', error);
    }
  };

  // Handle Revoke Access
  const handleRevokeAccess = (record) => {
    setUserToRevoke(record);
    setRevokeModalVisible(true);
  };

  const handleConfirmRevoke = () => {
    setSystemUsers(systemUsers.map(user =>
      user.key === userToRevoke.key ? { ...user, status: 'Revoked' } : user
    ));
    setRevokeModalVisible(false);
    setUserToRevoke(null);
  };

  // Table columns
  const columns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 200,
      fixed: 'left',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'User Type',
      dataIndex: 'userType',
      key: 'userType',
      width: 130,
      render: (text) => (
        <span style={{
          color: text === 'Super Admin' ? '#97230c' : text === 'Admin' ? '#1890ff' : '#52c41a',
          fontWeight: 600
        }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <span style={{
          color: status === 'Active' ? '#52c41a' : '#ff4d4f',
          fontWeight: 500
        }}>
          {status}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.status === 'Active' && (
            <Tooltip title="Change Role">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleChangeRole(record)}
                className="action-icon-btn"
                disabled={record.userType === 'Super Admin'}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="system-users-page">
      <div className="system-users-header">
        <h1 className="page-title">SYSTEM USERS</h1>
      </div>

      <Card className="system-users-table-card">
        <div className="system-users-table-header">
          <div className="table-header-left">
            <span className="table-title">System Users</span>
          </div>
          <div className="table-header-actions">
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleInviteUser}
            >
              Invite User
            </Button>
          </div>
        </div>
        <CustomTable
          columns={columns}
          dataSource={systemUsers}
          scroll={{ x: 800 }}
          pagination={{ pageSize: 20 }}
          loading={loadingSystemUsers}
        />
      </Card>

      {/* Invite User Modal */}
      <CustomModal
        title="Invite User"
        open={isGrantAccessModalVisible}
        onClose={() => {
          setIsGrantAccessModalVisible(false);
          grantAccessForm.resetFields();
          setSelectedResourceId(null);
        }}
        width={600}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: () => {
              setIsGrantAccessModalVisible(false);
              grantAccessForm.resetFields();
              setSelectedResourceId(null);
            },
            disabled: isSubmittingInvite,
          },
          {
            text: 'Send Invitation',
            type: 'primary',
            onClick: handleInviteSubmit,
            loading: isSubmittingInvite,
          },
        ]}
      >
        <Form form={grantAccessForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: 'Please select a user' },
            ]}
          >
            <Select
              placeholder="Select user"
              showSearch
              allowClear
              loading={loadingResources}
              onChange={handleResourceSelect}
              onClear={handleResourceClear}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={resourcesList.map(resource => ({
                value: resource.id,
                label: resource.name || resource.employee_name || 'N/A',
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Please enter a valid email address' },
            ]}
          >
            <Input
              placeholder="Email will be auto-filled when you select a user"
              disabled={!!selectedResourceId}
            />
          </Form.Item>
          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: 'Role is required' }]}
            help="Select the role for the user. Admin users have elevated permissions."
          >
            <Select placeholder="Select role">
              <Option value="User">User</Option>
              <Option value="Admin">Admin</Option>
            </Select>
          </Form.Item>
        </Form>
      </CustomModal>

      {/* Change Role Modal */}
      <CustomModal
        title="Change User Role"
        open={isChangeRoleModalVisible}
        onClose={() => {
          setIsChangeRoleModalVisible(false);
          changeRoleForm.resetFields();
          setSelectedUser(null);
        }}
        width={600}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: () => {
              setIsChangeRoleModalVisible(false);
              changeRoleForm.resetFields();
              setSelectedUser(null);
            },
          },
          {
            text: 'Revoke Access',
            type: 'default',
            danger: true,
            onClick: () => {
              if (selectedUser) {
                setIsChangeRoleModalVisible(false);
                changeRoleForm.resetFields();
                handleRevokeAccess(selectedUser);
                setSelectedUser(null);
              }
            },
            disabled: selectedUser?.userType === 'Super Admin',
          },
          {
            text: 'Update Role',
            type: 'primary',
            onClick: handleChangeRoleSubmit,
          },
        ]}
      >
        <Form form={changeRoleForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Employee Name"
              >
                <Input value={selectedUser?.employeeName || ''} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Email"
              >
                <Input value={selectedUser?.email || ''} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Tier"
              >
                <Input value={selectedUser?.tier || ''} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Status"
              >
                <Input value={selectedUser?.status || ''} disabled />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="New User Type"
                name="userType"
                rules={[{ required: true, message: 'User type is required' }]}
              >
                <Select placeholder="Select user type" size="large">
                  <Option value="User">User</Option>
                  <Option value="Admin">Admin</Option>
                  <Option value="Super Admin" disabled={systemUsers.some(u => u.userType === 'Super Admin' && u.key !== selectedUser?.key)}>
                    Super Admin {systemUsers.some(u => u.userType === 'Super Admin' && u.key !== selectedUser?.key) ? '(Already exists)' : ''}
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </CustomModal>

      {/* Revoke Access Confirmation Modal */}
      <Modal
        title="Revoke System User Access"
        open={revokeModalVisible}
        onOk={handleConfirmRevoke}
        onCancel={() => {
          setRevokeModalVisible(false);
          setUserToRevoke(null);
        }}
        okText="Revoke Access"
        okButtonProps={{ danger: true }}
      >
        {userToRevoke && (
          <div>
            <p>Are you sure you want to revoke system user access for:</p>
            <p><strong>{userToRevoke.employeeName}</strong></p>
            <p style={{ color: '#ff4d4f', marginTop: 8 }}>
              This will prevent the user from accessing the system. You can grant access again later.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SystemUsers;
