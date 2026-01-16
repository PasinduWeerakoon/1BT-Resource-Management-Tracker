import React, { useState } from 'react';
import { Card, Button, Form, Input, Tabs, Space, Tooltip, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomModal from '@components/Modal';
import CustomTable from '@components/Table';
import '@styles/pages/Configurations.scss';

const { Option } = Select;

const Configurations = () => {
  const [designationForm] = Form.useForm();
  const [trackForm] = Form.useForm();
  const [projectTypeForm] = Form.useForm();
  
  const [isDesignationModalVisible, setIsDesignationModalVisible] = useState(false);
  const [isTrackModalVisible, setIsTrackModalVisible] = useState(false);
  const [isProjectTypeModalVisible, setIsProjectTypeModalVisible] = useState(false);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('designations');

  // Mock data - will be replaced with API calls
  const [designations, setDesignations] = useState([
    { key: '1', name: 'SE', description: 'Software Engineer', tier: 'Tier 01' },
    { key: '2', name: 'SSE', description: 'Senior Software Engineer', tier: 'Tier 02' },
    { key: '3', name: 'ATL', description: 'Associate Tech Lead', tier: 'Tier 02' },
    { key: '4', name: 'STL', description: 'Senior Tech Lead', tier: 'Tier 03' },
    { key: '5', name: 'QAE', description: 'Quality Assurance Engineer', tier: 'Tier 01' },
  ]);

  const [tracks, setTracks] = useState([
    { key: '1', name: 'FS', description: 'Full Stack' },
    { key: '2', name: '.Net', description: '.Net Development' },
    { key: '3', name: 'DS', description: 'Data Science' },
    { key: '4', name: 'UI/UX', description: 'UI/UX Design' },
    { key: '5', name: 'QA', description: 'Quality Assurance' },
    { key: '6', name: 'PM/BA', description: 'Project Management / Business Analysis' },
  ]);

  const [projectTypes, setProjectTypes] = useState([
    { key: '1', name: 'Client', description: 'Client Project' },
    { key: '2', name: 'Bench', description: 'Bench Project' },
    { key: '3', name: 'Training', description: 'Training Project' },
    { key: '4', name: 'POC', description: 'Proof of Concept' },
    { key: '5', name: 'Presale', description: 'Presale Project' },
  ]);

  // Designation handlers
  const handleAddDesignation = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    designationForm.resetFields();
    setIsDesignationModalVisible(true);
  };

  const handleEditDesignation = (record) => {
    setIsEditMode(true);
    setSelectedItem(record);
    designationForm.setFieldsValue(record);
    setIsDesignationModalVisible(true);
  };

  const handleDeleteDesignation = (record) => {
    // TODO: Add confirmation dialog
    setDesignations(designations.filter(item => item.key !== record.key));
  };

  const handleDesignationSubmit = async () => {
    try {
      const values = await designationForm.validateFields();
      if (isEditMode) {
        setDesignations(designations.map(item =>
          item.key === selectedItem.key ? { ...values, key: item.key } : item
        ));
      } else {
        const newDesignation = {
          ...values,
          key: String(designations.length + 1),
        };
        setDesignations([...designations, newDesignation]);
      }
      setIsDesignationModalVisible(false);
      designationForm.resetFields();
      setSelectedItem(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Track handlers
  const handleAddTrack = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    trackForm.resetFields();
    setIsTrackModalVisible(true);
  };

  const handleEditTrack = (record) => {
    setIsEditMode(true);
    setSelectedItem(record);
    trackForm.setFieldsValue(record);
    setIsTrackModalVisible(true);
  };

  const handleDeleteTrack = (record) => {
    // TODO: Add confirmation dialog
    setTracks(tracks.filter(item => item.key !== record.key));
  };

  const handleTrackSubmit = async () => {
    try {
      const values = await trackForm.validateFields();
      if (isEditMode) {
        setTracks(tracks.map(item =>
          item.key === selectedItem.key ? { ...values, key: item.key } : item
        ));
      } else {
        const newTrack = {
          ...values,
          key: String(tracks.length + 1),
        };
        setTracks([...tracks, newTrack]);
      }
      setIsTrackModalVisible(false);
      trackForm.resetFields();
      setSelectedItem(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Project Type handlers
  const handleAddProjectType = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    projectTypeForm.resetFields();
    setIsProjectTypeModalVisible(true);
  };

  const handleEditProjectType = (record) => {
    setIsEditMode(true);
    setSelectedItem(record);
    projectTypeForm.setFieldsValue(record);
    setIsProjectTypeModalVisible(true);
  };

  const handleDeleteProjectType = (record) => {
    // TODO: Add confirmation dialog
    setProjectTypes(projectTypes.filter(item => item.key !== record.key));
  };

  const handleProjectTypeSubmit = async () => {
    try {
      const values = await projectTypeForm.validateFields();
      if (isEditMode) {
        setProjectTypes(projectTypes.map(item =>
          item.key === selectedItem.key ? { ...values, key: item.key } : item
        ));
      } else {
        const newProjectType = {
          ...values,
          key: String(projectTypes.length + 1),
        };
        setProjectTypes([...projectTypes, newProjectType]);
      }
      setIsProjectTypeModalVisible(false);
      projectTypeForm.resetFields();
      setSelectedItem(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Designation columns
  const designationColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300,
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditDesignation(record)}
              className="action-icon-btn"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteDesignation(record)}
              className="action-icon-btn"
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Track columns
  const trackColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditTrack(record)}
              className="action-icon-btn"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteTrack(record)}
              className="action-icon-btn"
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Project Type columns
  const projectTypeColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditProjectType(record)}
              className="action-icon-btn"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteProjectType(record)}
              className="action-icon-btn"
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="configurations-page">
      <div className="configurations-header">
        <h1 className="page-title">CONFIGURATIONS</h1>
      </div>

      <Card className="configurations-content-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'designations',
              label: 'Designation Related',
              children: (
                <div>
                  <div className="table-header-section">
                    <div className="table-header-left">
                      <span className="table-title">Designations</span>
                    </div>
                    <div className="table-header-actions">
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddDesignation}
                      >
                        Add Designation
                      </Button>
                    </div>
                  </div>
                  <CustomTable
                    columns={designationColumns}
                    dataSource={designations}
                    scroll={{ x: 600 }}
                    pagination={{ pageSize: 20 }}
                  />
                </div>
              ),
            },
            {
              key: 'tracks',
              label: 'Tracks',
              children: (
                <div>
                  <div className="table-header-section">
                    <div className="table-header-left">
                      <span className="table-title">Tracks</span>
                    </div>
                    <div className="table-header-actions">
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddTrack}
                      >
                        Add Track
                      </Button>
                    </div>
                  </div>
                  <CustomTable
                    columns={trackColumns}
                    dataSource={tracks}
                    scroll={{ x: 600 }}
                    pagination={{ pageSize: 20 }}
                  />
                </div>
              ),
            },
            {
              key: 'project-types',
              label: 'Project Types',
              children: (
                <div>
                  <div className="table-header-section">
                    <div className="table-header-left">
                      <span className="table-title">Project Types</span>
                    </div>
                    <div className="table-header-actions">
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddProjectType}
                      >
                        Add Project Type
                      </Button>
                    </div>
                  </div>
                  <CustomTable
                    columns={projectTypeColumns}
                    dataSource={projectTypes}
                    scroll={{ x: 600 }}
                    pagination={{ pageSize: 20 }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Add/Edit Designation Modal */}
      <CustomModal
        title={isEditMode ? 'Edit Designation' : 'Add New Designation'}
        open={isDesignationModalVisible}
        onClose={() => {
          setIsDesignationModalVisible(false);
          designationForm.resetFields();
          setSelectedItem(null);
          setIsEditMode(false);
        }}
        width={600}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: () => {
              setIsDesignationModalVisible(false);
              designationForm.resetFields();
              setSelectedItem(null);
              setIsEditMode(false);
            },
          },
          {
            text: isEditMode ? 'Update' : 'Add',
            type: 'primary',
            onClick: handleDesignationSubmit,
          },
        ]}
      >
        <Form form={designationForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="Enter designation name (e.g., SE, SSE)" />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Description is required' }]}
          >
            <Input placeholder="Enter designation description" />
          </Form.Item>
          <Form.Item
            label="Tier"
            name="tier"
            rules={[{ required: true, message: 'Tier is required' }]}
          >
            <Select placeholder="Select tier">
              <Option value="Tier 01">Tier 01</Option>
              <Option value="Tier 02">Tier 02</Option>
              <Option value="Tier 03">Tier 03</Option>
              <Option value="Tier 04">Tier 04</Option>
            </Select>
          </Form.Item>
        </Form>
      </CustomModal>

      {/* Add/Edit Track Modal */}
      <CustomModal
        title={isEditMode ? 'Edit Track' : 'Add New Track'}
        open={isTrackModalVisible}
        onClose={() => {
          setIsTrackModalVisible(false);
          trackForm.resetFields();
          setSelectedItem(null);
          setIsEditMode(false);
        }}
        width={600}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: () => {
              setIsTrackModalVisible(false);
              trackForm.resetFields();
              setSelectedItem(null);
              setIsEditMode(false);
            },
          },
          {
            text: isEditMode ? 'Update' : 'Add',
            type: 'primary',
            onClick: handleTrackSubmit,
          },
        ]}
      >
        <Form form={trackForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="Enter track name (e.g., FS, .Net, QA)" />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Description is required' }]}
          >
            <Input placeholder="Enter track description" />
          </Form.Item>
        </Form>
      </CustomModal>

      {/* Add/Edit Project Type Modal */}
      <CustomModal
        title={isEditMode ? 'Edit Project Type' : 'Add New Project Type'}
        open={isProjectTypeModalVisible}
        onClose={() => {
          setIsProjectTypeModalVisible(false);
          projectTypeForm.resetFields();
          setSelectedItem(null);
          setIsEditMode(false);
        }}
        width={600}
        buttons={[
          {
            text: 'Cancel',
            type: 'default',
            onClick: () => {
              setIsProjectTypeModalVisible(false);
              projectTypeForm.resetFields();
              setSelectedItem(null);
              setIsEditMode(false);
            },
          },
          {
            text: isEditMode ? 'Update' : 'Add',
            type: 'primary',
            onClick: handleProjectTypeSubmit,
          },
        ]}
      >
        <Form form={projectTypeForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="Enter project type name (e.g., Client, Bench, Training)" />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Description is required' }]}
          >
            <Input placeholder="Enter project type description" />
          </Form.Item>
        </Form>
      </CustomModal>
    </div>
  );
};

export default Configurations;
