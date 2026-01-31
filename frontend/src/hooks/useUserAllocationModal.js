import { useState, useEffect } from 'react';
import { Form, message } from 'antd';
import dayjs from 'dayjs';

export const useUserAllocationModal = (allocationData = [], { onSave, resourceId } = {}) => {
    const [isUserAllocationModalVisible, setIsUserAllocationModalVisible] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [userAllocationsList, setUserAllocationsList] = useState([]);
    const [userAllocationsForm] = Form.useForm();

    // Note: Form values are set in the UserAllocationModal component's useEffect
    // This ensures the form is ready before values are set

    const handleRowClick = (record) => {
        const employeeName = record.employeeName;
        setSelectedEmployee(employeeName);

        // Get all allocations for this employee
        const employeeAllocations = allocationData.filter(item => item.employeeName === employeeName);

        // Transform to modal format
        const allocationsList = employeeAllocations.map((allocation, index) => {
            let allocatedDate = undefined;
            let deallocatedDate = undefined;

            // Parse allocated date
            if (allocation.allocatedDate) {
                allocatedDate = dayjs(allocation.allocatedDate, 'DD MMM YYYY');
                if (!allocatedDate.isValid()) {
                    allocatedDate = dayjs(allocation.allocatedDate);
                }
                if (!allocatedDate.isValid()) {
                    allocatedDate = undefined;
                }
            }

            // Parse deallocated date
            if (allocation.deallocatedDate && allocation.deallocatedDate.toString().trim() !== '') {
                deallocatedDate = dayjs(allocation.deallocatedDate, 'DD MMM YYYY');
                if (!deallocatedDate.isValid()) {
                    deallocatedDate = dayjs(allocation.deallocatedDate);
                }
                if (!deallocatedDate.isValid()) {
                    deallocatedDate = undefined;
                }
            }

            // Parse billing percentage
            let billingPercentage = 0;
            if (allocation.billingPercentage) {
                const bpStr = allocation.billingPercentage.toString().replace('%', '').trim();
                billingPercentage = parseFloat(bpStr) || 0;
            }

            // Parse project allocation
            let projectAllocation = 0;
            if (allocation.projectAllocation) {
                const paStr = allocation.projectAllocation.toString().replace('%', '').trim();
                projectAllocation = parseFloat(paStr) || 0;
            }

            return {
                key: `existing-${allocation.key || index}`,
                projectName: allocation.project,
                allocatedDate: allocatedDate,
                deallocatedDate: deallocatedDate,
                billingStatus: allocation.billingStatus,
                billingPercentage: billingPercentage,
                projectAllocation: projectAllocation,
                duration: allocation.duration || 0,
                status: allocation.status || 'Active',
                isExisting: true,
            };
        });

        setUserAllocationsList(allocationsList);
        setIsUserAllocationModalVisible(true);
    };

    const handleUserAllocationCancel = () => {
        setIsUserAllocationModalVisible(false);
        setSelectedEmployee(null);
        setUserAllocationsList([]);
        userAllocationsForm.resetFields();
    };

    const handleAddUserAllocationRow = () => {
        const newAllocation = {
            key: `new-${Date.now()}`,
            projectName: undefined,
            allocatedDate: undefined,
            deallocatedDate: undefined,
            billingStatus: 'Billing',
            billingPercentage: 0,
            projectAllocation: 0,
            duration: 0,
            status: 'Active',
            isExisting: false,
        };
        setUserAllocationsList([...userAllocationsList, newAllocation]);
    };

    const handleRemoveUserAllocationRow = (key) => {
        setUserAllocationsList(userAllocationsList.filter(allocation => allocation.key !== key));
    };

    const handleUserAllocationFieldChange = (allocationKey, field, value) => {
        setUserAllocationsList(userAllocationsList.map(allocation =>
            allocation.key === allocationKey ? { ...allocation, [field]: value } : allocation
        ));
    };

    const handleUserAllocationsSubmit = async () => {
        try {
            const formValues = await userAllocationsForm.getFieldsValue();
            const errors = [];

            userAllocationsList.forEach((allocation, index) => {
                if (!allocation.projectName) {
                    errors.push(`Allocation ${index + 1}: Project name is required`);
                }
                if (!allocation.allocatedDate) {
                    errors.push(`Allocation ${index + 1}: Allocated date is required`);
                }
                if (allocation.billingPercentage === undefined || allocation.billingPercentage === null) {
                    errors.push(`Allocation ${index + 1}: Billing percentage is required`);
                }
                if (allocation.projectAllocation === undefined || allocation.projectAllocation === null) {
                    errors.push(`Allocation ${index + 1}: Project allocation is required`);
                }
                if (allocation.duration === undefined || allocation.duration === null) {
                    errors.push(`Allocation ${index + 1}: Duration is required`);
                }
            });

            if (errors.length > 0) {
                console.error('Validation errors:', errors);
                return;
            }

            // Get form values and merge with userAllocationsList
            const allocationsToSave = userAllocationsList.map((allocation) => {
                const allocationFormData = formValues.allocations?.[allocation.key] || {};

                // Format dates for API (YYYY-MM-DD)
                const effectiveDate = allocation.allocatedDate
                    ? (allocation.allocatedDate.format ? allocation.allocatedDate.format('YYYY-MM-DD') : allocation.allocatedDate)
                    : null;
                const deallocatedDate = allocation.deallocatedDate
                    ? (allocation.deallocatedDate.format ? allocation.deallocatedDate.format('YYYY-MM-DD') : allocation.deallocatedDate)
                    : null;

                return {
                    employeeName: selectedEmployee,
                    // Map to API field names
                    effective_date: effectiveDate,
                    end_date: deallocatedDate,
                    allocation_percentage: allocation.projectAllocation,
                    billing_percentage: allocation.billingPercentage,
                    // Keep original data for reference
                    ...allocation,
                    ...allocationFormData,
                };
            });

            console.log('Saving user allocations:', allocationsToSave);

            // Call onSave callback if provided
            if (onSave) {
                try {
                    const result = await onSave(allocationsToSave, resourceId);

                    // Check if any allocations were scheduled for future
                    const futureAllocations = result?.filter(r => r.isFutureAllocation);
                    if (futureAllocations?.length > 0) {
                        message.info(`${futureAllocations.length} allocation(s) scheduled for future activation`);
                    } else {
                        message.success('Allocations saved successfully');
                    }
                } catch (saveError) {
                    message.error('Failed to save allocations: ' + saveError.message);
                    return;
                }
            }

            setIsUserAllocationModalVisible(false);
            setSelectedEmployee(null);
            setUserAllocationsList([]);
            userAllocationsForm.resetFields();
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    return {
        isUserAllocationModalVisible,
        selectedEmployee,
        userAllocationsList,
        userAllocationsForm,
        handleRowClick,
        handleUserAllocationCancel,
        handleAddUserAllocationRow,
        handleRemoveUserAllocationRow,
        handleUserAllocationFieldChange,
        handleUserAllocationsSubmit,
    };
};
