/**
 * Tech Stack Tab Component
 * Displays tech stack data from Redux store (read-only view)
 */

import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ConfigTable from '../components/ConfigTable';
import { selectTechStacks, selectTechStacksLoading, fetchAllConfigData } from '@redux/slices/configSlice';

const TechStackTab = () => {
  const dispatch = useDispatch();
  // Get data from Redux
  const techStacksData = useSelector(selectTechStacks);
  const loadingTechStacks = useSelector(selectTechStacksLoading);

  // Transform data for table display
  const techStacks = useMemo(() => {
    return techStacksData.map((item, index) => ({
      key: item.id || `tech-stack-${index}`,
      id: item.id,
      name: item.label || item.name,
      description: item.description || '',
      is_active: item.isActive !== undefined ? item.isActive : (item.is_active !== undefined ? item.is_active : true),
    }));
  }, [techStacksData]);

  useEffect(() => {
    // Fetch data if not already loaded
    if (!techStacksData.length && !loadingTechStacks) {
      dispatch(fetchAllConfigData());
    }
  }, [dispatch, techStacksData.length, loadingTechStacks]);

  // Columns - no action column needed
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 400,
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
  ];

  return (
    <>
      <ConfigTable
        columns={columns}
        dataSource={techStacks}
        loading={loadingTechStacks}
        // No onEdit or onDelete - so no action column will be shown
        // No onAdd - so no add button will be shown
        pagination={{ pageSize: 20 }}
        scroll={{ x: 600 }}
        title="Tech Stack"
      />
    </>
  );
};

export default TechStackTab;
