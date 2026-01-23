import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Tabs, Space, Tooltip, Select, Switch, message, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomModal from '@components/Modal';
import CustomTable from '@components/Table';
import { tracksService, designationsService } from '@api';
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

  const [designations, setDesignations] = useState([]);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [designationLoading, setDesignationLoading] = useState(false);

  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [trackLoading, setTrackLoading] = useState(false);

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
    designationForm.setFieldsValue({
      name: record.name,
      tier: record.tier || (record.level ? `Tier ${String(record.level).padStart(2, '0')}` : 'Tier 01'),
      is_active: record.is_active !== undefined ? record.is_active : true,
    });
    setIsDesignationModalVisible(true);
  };

  // Fetch designations from API
  const fetchDesignations = async () => {
    try {
      setLoadingDesignations(true);
      const response = await designationsService.getAll();
      
      // Handle response structure after interceptor transformation
      let designationsData = [];
      
      if (response) {
        // Check if response has data array directly (after interceptor transformation)
        if (Array.isArray(response.data)) {
          designationsData = response.data;
        }
        // Check if response has nested data structure
        else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          designationsData = response.data.data;
        }
        // Check if response is the data object directly
        else if (response.data && Array.isArray(response.data)) {
          designationsData = response.data;
        }
        // Fallback: response is an array
        else if (Array.isArray(response)) {
          designationsData = response;
        }
      }

      // Transform designations data to match table format
      // Map level (1-4) to tier display (Tier 01-04)
      const transformedDesignations = designationsData.map((designation) => ({
        key: designation.id,
        id: designation.id,
        name: designation.name,
        level: designation.level,
        tier: designation.level ? `Tier ${String(designation.level).padStart(2, '0')}` : null,
        is_active: designation.is_active !== undefined ? designation.is_active : true,
      }));

      setDesignations(transformedDesignations);
    } catch (error) {
      console.error('Failed to fetch designations:', error);
      message.error('Failed to load designations');
    } finally {
      setLoadingDesignations(false);
    }
  };

  // Fetch designations on component mount and when designations tab is active
  useEffect(() => {
    if (activeTab === 'designations') {
      fetchDesignations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleDeleteDesignation = (record) => {
    Modal.confirm({
      title: 'Delete Designation',
      content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Note: API doesn't have DELETE endpoint, so we'll deactivate instead
          await designationsService.update(record.id, {
            name: record.name,
            level: record.level,
            is_active: false,
          });
          
          message.success('Designation deactivated successfully');
          fetchDesignations();
        } catch (error) {
          console.error('Failed to delete designation:', error);
          message.error(error?.message || 'Failed to delete designation');
        }
      },
    });
  };

  const handleDesignationSubmit = async () => {
    try {
      setDesignationLoading(true);
      const values = await designationForm.validateFields();
      
      // Convert tier string (Tier 01) to level number (1)
      const level = values.tier ? parseInt(values.tier.replace('Tier ', '')) : 1;
      
      // Prepare API payload
      const designationPayload = {
        name: values.name,
        level: level,
        is_active: values.is_active !== undefined ? values.is_active : true,
      };

      if (isEditMode) {
        // Update designation
        const response = await designationsService.update(selectedItem.id, designationPayload);
        
        if (response && (response.success !== false || response.data)) {
          message.success('Designation updated successfully');
          await fetchDesignations();
        } else {
          message.error(response?.message || 'Failed to update designation');
        }
      } else {
        // Create designation
        const response = await designationsService.create(designationPayload);
        
        if (response && (response.success !== false || response.data)) {
          message.success('Designation created successfully');
          await fetchDesignations();
        } else {
          message.error(response?.message || 'Failed to create designation');
        }
      }

      setIsDesignationModalVisible(false);
      designationForm.resetFields();
      setSelectedItem(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Designation submit error:', error);
      message.error(error?.message || 'Failed to save designation');
    } finally {
      setDesignationLoading(false);
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
    trackForm.setFieldsValue({
      name: record.name,
      description: record.description,
      is_active: record.is_active !== undefined ? record.is_active : true,
    });
    setIsTrackModalVisible(true);
  };

  const handleDeleteTrack = (record) => {
    Modal.confirm({
      title: 'Delete Track',
      content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Note: API doesn't have DELETE endpoint, so we'll deactivate instead
          // If DELETE endpoint exists, uncomment below:
          // await tracksService.delete(record.id);
          
          // For now, update to inactive
          await tracksService.update(record.id, {
            name: record.name,
            description: record.description,
            is_active: false,
          });
          
          message.success('Track deactivated successfully');
          fetchTracks();
        } catch (error) {
          console.error('Failed to delete track:', error);
          message.error(error?.message || 'Failed to delete track');
        }
      },
    });
  };

  // Fetch tracks from API
  const fetchTracks = async () => {
    try {
      setLoadingTracks(true);
      const response = await tracksService.getAll();
      
      // Handle response structure after interceptor transformation
      let tracksData = [];
      
      if (response) {
        // Check if response has data array directly (after interceptor transformation)
        if (Array.isArray(response.data)) {
          tracksData = response.data;
        }
        // Check if response has nested data structure
        else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          tracksData = response.data.data;
        }
        // Check if response is the data object directly
        else if (response.data && Array.isArray(response.data)) {
          tracksData = response.data;
        }
        // Fallback: response is an array
        else if (Array.isArray(response)) {
          tracksData = response;
        }
      }

      // Transform tracks data to match table format
      const transformedTracks = tracksData.map((track) => ({
        key: track.id,
        id: track.id,
        name: track.name,
        description: track.description || '',
        is_active: track.is_active !== undefined ? track.is_active : true,
      }));

      setTracks(transformedTracks);
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
      message.error('Failed to load tracks');
    } finally {
      setLoadingTracks(false);
    }
  };

  // Fetch tracks on component mount and when tracks tab is active
  useEffect(() => {
    if (activeTab === 'tracks') {
      fetchTracks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleTrackSubmit = async () => {
    try {
      setTrackLoading(true);
      const values = await trackForm.validateFields();
      
      // Prepare API payload
      const trackPayload = {
        name: values.name,
        description: values.description || '',
        is_active: values.is_active !== undefined ? values.is_active : true,
      };

      if (isEditMode) {
        // Update track
        const response = await tracksService.update(selectedItem.id, trackPayload);
        
        if (response && (response.success !== false || response.data)) {
          message.success('Track updated successfully');
          await fetchTracks();
        } else {
          message.error(response?.message || 'Failed to update track');
        }
      } else {
        // Create track
        const response = await tracksService.create(trackPayload);
        
        if (response && (response.success !== false || response.data)) {
          message.success('Track created successfully');
          await fetchTracks();
        } else {
          message.error(response?.message || 'Failed to create track');
        }
      }

      setIsTrackModalVisible(false);
      trackForm.resetFields();
      setSelectedItem(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Track submit error:', error);
      message.error(error?.message || 'Failed to save track');
    } finally {
      setTrackLoading(false);
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
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      width: 120,
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        <span style={{ color: isActive ? '#52c41a' : '#ff4d4f' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
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
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        <span style={{ color: isActive ? '#52c41a' : '#ff4d4f' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
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
                    loading={loadingDesignations}
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
                    loading={loadingTracks}
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
            loading: designationLoading,
          },
        ]}
      >
        <Form form={designationForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: 'Name is required' },
              { max: 50, message: 'Name must be less than 50 characters' },
            ]}
          >
            <Input placeholder="Enter designation name (e.g., SE, SSE, ATL)" />
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
          <Form.Item
            label="Active"
            name="is_active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
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
            loading: trackLoading,
          },
        ]}
      >
        <Form form={trackForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: 'Name is required' },
              { max: 50, message: 'Name must be less than 50 characters' },
            ]}
          >
            <Input placeholder="Enter track name (e.g., FS, .Net, QA)" />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: 'Description is required' },
              { max: 255, message: 'Description must be less than 255 characters' },
            ]}
          >
            <Input placeholder="Enter track description" />
          </Form.Item>
          <Form.Item
            label="Active"
            name="is_active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
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
