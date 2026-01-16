import React, { useState, useMemo } from 'react';
import { Card, Button, Form, Input, Select, Table, Space, Tooltip, Modal, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, UserDeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import CustomModal from '@components/Modal';
import CustomTable from '@components/Table';
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

  // Mock employees data (from Employee Management)
  const [employees] = useState([
    { key: '1', employeeNumber: 'EMP001', name: 'John Doe', tier: 'Tier 01', position: 'Senior Software Engineer', status: 'Active' },
    { key: '2', employeeNumber: 'EMP002', name: 'Jane Smith', tier: 'Tier 02', position: 'Software Engineer', status: 'Active' },
    { key: '3', employeeNumber: 'EMP003', name: 'Bob Johnson', tier: 'Tier 03', position: 'Tech Lead', status: 'Active' },
  ]);

  // Mock system users data
  const [systemUsers, setSystemUsers] = useState([
    {
      key: '1',
      employeeNumber: 'EMP001',
      employeeName: 'John Doe',
      email: 'john.doe@company.com',
      username: 'johndoe',
      userType: 'Super Admin',
      status: 'Active',
      tier: 'Tier 01',
      position: 'Senior Software Engineer',
    },
    {
      key: '2',
      employeeNumber: 'EMP002',
      employeeName: 'Jane Smith',
      email: 'jane.smith@company.com',
      username: 'janesmith',
      userType: 'Admin',
      status: 'Active',
      tier: 'Tier 02',
      position: 'Software Engineer',
    },
  ]);

  // Get employees who are not yet system users
  const availableEmployees = useMemo(() => {
    const systemUserEmployeeNumbers = systemUsers.map(user => user.employeeNumber);
    return employees.filter(emp => !systemUserEmployeeNumbers.includes(emp.employeeNumber));
  }, [employees, systemUsers]);

  // Handle Grant Access
  const handleGrantAccess = () => {
    grantAccessForm.resetFields();
    setIsGrantAccessModalVisible(true);
  };

  const handleGrantAccessSubmit = async () => {
    try {
      const values = await grantAccessForm.validateFields();
      const selectedEmployee = employees.find(emp => emp.employeeNumber === values.employeeNumber);
      
      const newSystemUser = {
        key: String(systemUsers.length + 1),
        employeeNumber: selectedEmployee.employeeNumber,
        employeeName: selectedEmployee.name,
        email: values.email || `${selectedEmployee.employeeNumber.toLowerCase()}@company.com`,
        userType: values.userType || 'User',
        status: 'Active',
        tier: selectedEmployee.tier,
      };
      
      setSystemUsers([...systemUsers, newSystemUser]);
      setIsGrantAccessModalVisible(false);
      grantAccessForm.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
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
      console.error('Validation failed:', error);
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
              onClick={handleGrantAccess}
            >
              Grant Access
            </Button>
          </div>
        </div>
        <CustomTable
          columns={columns}
          dataSource={systemUsers}
          scroll={{ x: 800 }}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* Grant Access Modal */}
      <CustomModal
        title="Grant System User Access"
        open={isGrantAccessModalVisible}
        onClose={() => {
          setIsGrantAccessModalVisible(false);
          grantAccessForm.resetFields();
        }}
        width={600}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: () => {
              setIsGrantAccessModalVisible(false);
              grantAccessForm.resetFields();
            },
          },
          {
            text: 'Grant Access',
            type: 'primary',
            onClick: handleGrantAccessSubmit,
          },
        ]}
      >
        <Form form={grantAccessForm} layout="vertical">
          <Form.Item
            label="Employee"
            name="employeeNumber"
            rules={[{ required: true, message: 'Employee is required' }]}
          >
            <Select
              placeholder="Select employee"
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {availableEmployees.map(emp => (
                <Option key={emp.employeeNumber} value={emp.employeeNumber}>
                  {emp.employeeNumber} - {emp.name} ({emp.position})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="User Type"
            name="userType"
            rules={[{ required: true, message: 'User type is required' }]}
          >
            <Select placeholder="Select user type">
              <Option value="User">User</Option>
              <Option value="Admin">Admin</Option>
              <Option value="Super Admin" disabled={systemUsers.some(u => u.userType === 'Super Admin')}>
                Super Admin {systemUsers.some(u => u.userType === 'Super Admin') ? '(Already exists)' : ''}
              </Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="Enter email address" />
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
