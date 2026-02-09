/**
 * useTeamManagement Hook
 * Handles team members modal state, member CRUD, and form syncing
 */

import { useState, useEffect, useCallback } from 'react';
import { Form } from 'antd';
import dayjs from 'dayjs';
import { allocationsService, resourcesService } from '@api';
import { showErrorToast, showWarningToast } from '@utils/toast.utils';
import logger from '@utils/logger';

const useTeamManagement = ({ resourcesList }) => {
  const [isAddTeamMembersModalVisible, setIsAddTeamMembersModalVisible] = useState(false);
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState(null);
  const [teamMembersForm] = Form.useForm();
  const [teamMembersList, setTeamMembersList] = useState([]);

  // ─── Open modal and fetch allocations ───
  const handleAddTeamMembers = useCallback(async (project) => {
    setSelectedProjectForTeam(project);
    setIsAddTeamMembersModalVisible(true);
    setTeamMembersList([]);

    try {
      const response = await allocationsService.getAll({
        project_id: project.id,
        page: 1,
        limit: 100,
      });

      let allocationsData = [];
      if (response) {
        if (response.data && Array.isArray(response.data)) {
          allocationsData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          allocationsData = response.data.data;
        } else if (Array.isArray(response)) {
          allocationsData = response;
        } else if (response.data?.id) {
          allocationsData = [response.data];
        }
      }

      const transformedMembers = await Promise.all(
        allocationsData.map(async (allocation, index) => {
          let allocatedDate = allocation.start_date ? dayjs(allocation.start_date) : undefined;
          let deallocatedDate = allocation.end_date ? dayjs(allocation.end_date) : undefined;

          const allocationPercentage =
            typeof allocation.allocation_percentage === 'string'
              ? parseFloat(allocation.allocation_percentage)
              : allocation.allocation_percentage || 0;
          const billingPercentage =
            typeof allocation.billing_percentage === 'string'
              ? parseFloat(allocation.billing_percentage)
              : allocation.billing_percentage || 0;

          // Determine billing status
          let billingStatus = 'Non-Billing';
          if (allocation.project_type === 'Client' || allocation.project_is_billable) billingStatus = 'Billing';
          else if (allocation.project_type === 'Bench') billingStatus = 'Bench';
          else if (['Pre-Sales', 'Presale', 'Pre-Sale'].includes(allocation.project_type)) billingStatus = 'Presale';
          else if (allocation.project_type === 'Training') billingStatus = 'Training';

          // Duration
          let duration = 0;
          if (allocation.start_date) {
            const start = dayjs(allocation.start_date);
            const end = allocation.end_date ? dayjs(allocation.end_date) : dayjs();
            duration = end.diff(start, 'day');
          }

          // Resource name resolution
          let resourceName =
            allocation.resource_name || allocation.employeeName || allocation.name;
          if (!resourceName && allocation.resource_id) {
            const resource = resourcesList.find((r) => r.id === allocation.resource_id);
            if (resource) {
              resourceName = resource.name;
            } else {
              try {
                const res = await resourcesService.getById(allocation.resource_id);
                if (res?.data) resourceName = res.data.name || 'N/A';
              } catch {
                // ignore
              }
            }
          }
          resourceName = resourceName || 'N/A';

          return {
            key: `existing-${allocation.id || index}`,
            id: allocation.id,
            resource_id: allocation.resource_id,
            employeeName: resourceName,
            employeeId: allocation.resource_id,
            projectName: allocation.project_name || project.project,
            allocatedDate,
            deallocatedDate,
            billingStatus,
            billingPercentage,
            projectAllocation: allocationPercentage,
            duration,
            status: allocation.is_active !== undefined ? (allocation.is_active ? 'Active' : 'Inactive') : 'Active',
            isExisting: true,
          };
        })
      );

      setTeamMembersList(transformedMembers);
      if (transformedMembers.length === 0) {
        showWarningToast('No allocations found for this project');
      }
    } catch (error) {
      logger.error('Failed to fetch project allocations:', error);
      showErrorToast(error?.response?.data?.message || error?.message || 'Failed to load project allocations');
      setTeamMembersList([]);
    }
  }, [resourcesList]);

  // ─── Cancel ───
  const handleAddTeamMembersCancel = useCallback(() => {
    setIsAddTeamMembersModalVisible(false);
    setSelectedProjectForTeam(null);
    setTeamMembersList([]);
    teamMembersForm.resetFields();
  }, [teamMembersForm]);

  // ─── Add row ───
  const handleAddTeamMemberRow = useCallback(() => {
    if (teamMembersList.length >= (selectedProjectForTeam?.teamSize || 0)) {
      logger.warn('Team size limit reached');
      return;
    }
    setTeamMembersList((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}`,
        id: undefined,
        resource_id: undefined,
        employeeId: undefined,
        employeeName: undefined,
        projectName: selectedProjectForTeam?.project || '',
        allocatedDate: undefined,
        deallocatedDate: undefined,
        billingStatus: 'Billing',
        billingPercentage: 0,
        projectAllocation: 0,
        duration: 0,
        status: 'Active',
        isExisting: false,
      },
    ]);
  }, [teamMembersList.length, selectedProjectForTeam]);

  // ─── Field change ───
  const handleMemberFieldChange = useCallback(
    (memberKey, field, value) => {
      setTeamMembersList((prev) =>
        prev.map((member) => {
          if (member.key !== memberKey) return member;
          const updated = { ...member, [field]: value };

          if (field === 'employeeName' && value) {
            const selectedResource = resourcesList.find((r) => r.id === value);
            if (selectedResource) {
              updated.resource_id = selectedResource.id;
              updated.employeeId = selectedResource.id;
              updated.employeeName = selectedResource.name;
            }
          }

          if (field === 'allocatedDate' || field === 'deallocatedDate') {
            if (updated.allocatedDate) {
              const start = dayjs(updated.allocatedDate);
              const end = updated.deallocatedDate ? dayjs(updated.deallocatedDate) : dayjs();
              updated.duration = end.diff(start, 'day');
            }
          }

          return updated;
        })
      );
    },
    [resourcesList]
  );

  // ─── Remove row ───
  const handleRemoveTeamMemberRow = useCallback((key) => {
    setTeamMembersList((prev) => prev.filter((m) => m.key !== key));
  }, []);

  // ─── Submit ───
  const handleTeamMembersSubmit = useCallback(async () => {
    try {
      const formValues = await teamMembersForm.getFieldsValue();
      const errors = [];

      teamMembersList.forEach((member, i) => {
        if (!member.employeeName) errors.push(`Member ${i + 1}: Employee name is required`);
        if (!member.allocatedDate) errors.push(`Member ${i + 1}: Allocated date is required`);
        if (member.billingPercentage == null) errors.push(`Member ${i + 1}: Billing percentage is required`);
        if (member.projectAllocation == null) errors.push(`Member ${i + 1}: Project allocation is required`);
        if (member.duration == null) errors.push(`Member ${i + 1}: Duration is required`);
      });

      if (errors.length > 0) {
        logger.error('Validation errors:', errors);
        return;
      }

      const membersToSave = teamMembersList.map((member) => {
        const memberFormData = formValues.members?.[member.key] || {};
        return { ...member, ...memberFormData };
      });

      logger.debug('Saving team members:', membersToSave);
      // TODO: Add API call to save team members

      handleAddTeamMembersCancel();
    } catch (error) {
      logger.error('Validation failed:', error);
    }
  }, [teamMembersList, teamMembersForm, handleAddTeamMembersCancel]);

  // ─── Sync form values when modal opens ───
  useEffect(() => {
    if (isAddTeamMembersModalVisible && teamMembersList.length > 0) {
      const formValues = { members: {} };
      teamMembersList.forEach((member) => {
        formValues.members[member.key] = {
          employeeName: member.employeeName,
          projectName: member.projectName,
          allocatedDate: member.allocatedDate,
          deallocatedDate: member.deallocatedDate,
          billingStatus: member.billingStatus,
          billingPercentage: member.billingPercentage,
          projectAllocation: member.projectAllocation,
          duration: member.duration,
          status: member.status,
        };
      });

      const timer = setTimeout(() => {
        try {
          teamMembersForm.setFieldsValue(formValues);
        } catch (error) {
          logger.error('Error setting team members form values:', error);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isAddTeamMembersModalVisible, teamMembersList, teamMembersForm]);

  return {
    isAddTeamMembersModalVisible,
    selectedProjectForTeam,
    teamMembersForm,
    teamMembersList,
    handleAddTeamMembers,
    handleAddTeamMembersCancel,
    handleAddTeamMemberRow,
    handleMemberFieldChange,
    handleRemoveTeamMemberRow,
    handleTeamMembersSubmit,
  };
};

export default useTeamManagement;
