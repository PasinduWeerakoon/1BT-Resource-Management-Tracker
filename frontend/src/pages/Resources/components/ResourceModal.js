/**
 * ResourceModal Component
 * Add/Edit Employee form modal with multi-step form
 */

import React, { useState, useEffect } from 'react';
import { Form, Steps, Button, Space } from 'antd';
import CustomModal from '@components/Modal';
import PersonalInfoStep from './ResourceModal/PersonalInfoStep';
import EmploymentDetailsStep from './ResourceModal/EmploymentDetailsStep';
import EducationInternshipStep from './ResourceModal/EducationInternshipStep';
import BillingAllocationStep from './ResourceModal/BillingAllocationStep';
import AdditionalInfoStep from './ResourceModal/AdditionalInfoStep';
import PropTypes from 'prop-types';

const stepItems = [
  {
    title: 'Personal',
  },
  {
    title: 'Employment',
  },
  {
    title: 'Education',
  },
  {
    title: 'Billing',
  },
  {
    title: 'Additional',
  },
];

const ResourceModal = ({
  isVisible,
  isEditMode,
  loading,
  form,
  onClose,
  onSubmit,
  tiers,
  designations,
  tracks,
  tags,
  employeeTypes,
  techStacks,
  universities,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFormValid, setIsFormValid] = useState(false);

  // Watch required fields to determine if form is valid
  const name = Form.useWatch('name', form);
  const email = Form.useWatch('email', form);
  const emp_no = Form.useWatch('emp_no', form);
  const epf_no = Form.useWatch('epf_no', form);
  const employee_type_id = Form.useWatch('employee_type_id', form);
  const designation_id = Form.useWatch('designation_id', form);
  const tier_id = Form.useWatch('tier_id', form);
  const track_id = Form.useWatch('track_id', form);
  const status = Form.useWatch('status', form);

  // Check if all required fields are filled
  useEffect(() => {
    const checkFormValidity = async () => {
      try {
        // Get all required fields based on mode
        const requiredFields = isEditMode
          ? ['name', 'email', 'epf_no', 'emp_no', 'employee_type_id', 'designation_id', 'tier_id', 'track_id', 'status']
          : ['name', 'email', 'epf_no', 'emp_no', 'employee_type_id', 'designation_id', 'tier_id', 'track_id'];

        // Validate required fields
        await form.validateFields(requiredFields);

        // Check if all required fields have values
        const values = form.getFieldsValue();
        const allFieldsFilled = requiredFields.every(field => {
          const value = values[field];
          if (value === undefined || value === null || value === '') {
            return false;
          }
          // For date fields, check if it's a valid dayjs object
          if (field === 'joined_date' || field === 'last_increment_date' || field === 'last_promotion_date' || field === 'internship_completion_target_date') {
            return !value || (value && value.isValid && value.isValid());
          }
          return true;
        });

        setIsFormValid(allFieldsFilled);
      } catch (error) {
        setIsFormValid(false);
      }
    };

    // Check validity when fields change
    const timer = setTimeout(() => {
      checkFormValidity();
    }, 100);

    return () => clearTimeout(timer);
  }, [name, email, epf_no, emp_no, employee_type_id, designation_id, tier_id, track_id, status, isEditMode, form]);

  // Handle step navigation
  const handleNext = async () => {
    try {
      // Validate current step fields
      const fieldsToValidate = getStepFields(currentStep);
      await form.validateFields(fieldsToValidate);
      if (currentStep < stepItems.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Get fields for each step for validation
  const getStepFields = (step) => {
    const stepFields = {
      0: ['name', 'email', 'epf_no'], // Personal Info (name, email, epf_no are required)
      1: isEditMode
        ? ['emp_no', 'employee_type_id', 'designation_id', 'tier_id', 'track_id', 'status']
        : ['emp_no', 'employee_type_id', 'designation_id', 'tier_id', 'track_id'], // Employment (joined_date is optional)
      2: [], // Education (optional fields)
      3: [], // Billing (optional fields)
      4: [], // Additional (optional fields)
    };
    return stepFields[step] || [];
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      // Validate all fields
      await form.validateFields();
      onSubmit();
      // Reset step on successful submit
      setCurrentStep(0);
    } catch (error) {
      console.error('Form validation failed:', error);
      // Find the first error step and navigate to it
      if (error.errorFields && error.errorFields.length > 0) {
        const firstErrorField = error.errorFields[0].name?.[0];
        if (firstErrorField) {
          const errorStep = getStepForField(firstErrorField);
          if (errorStep !== null) {
            setCurrentStep(errorStep);
          }
        }
      }
    }
  };

  // Get step number for a field
  const getStepForField = (fieldName) => {
    const fieldStepMap = {
      name: 0, email: 0, mobile: 0, epf_no: 0, global_employee_id: 0, photo: 0,
      emp_no: 1, employee_type_id: 1, designation_id: 1, tier_id: 1, track_id: 1,
      tech_stack_id: 1, joined_date: 1, last_increment_date: 1, last_promotion_date: 1, status: 1,
      university_id: 2, is_intern: 2, internship_completion_target_date: 2,
      total_allocation: 3, total_resource_billing: 3,
      tag_ids: 4, skills: 4, helper_id: 4, helper: 4,
    };
    return fieldStepMap[fieldName] !== undefined ? fieldStepMap[fieldName] : null;
  };

  // Reset step when modal closes
  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <PersonalInfoStep form={form} isEditMode={isEditMode} />;
      case 1:
        return (
          <EmploymentDetailsStep
            form={form}
            isEditMode={isEditMode}
            designations={designations}
            tiers={tiers}
            tracks={tracks}
            techStacks={techStacks}
            employeeTypes={employeeTypes}
          />
        );
      case 2:
        return <EducationInternshipStep form={form} universities={universities} />;
      case 3:
        return <BillingAllocationStep form={form} />;
      case 4:
        return <AdditionalInfoStep form={form} tags={tags} />;
      default:
        return null;
    }
  };

  return (
    <CustomModal
      title={isEditMode ? 'Edit Employee Details' : 'Add New Employee'}
      open={isVisible}
      onClose={handleClose}
      width={1000}
      buttons={[
        {
          text: 'Cancel',
          type: 'default',
          onClick: handleClose,
        },
        {
          text: isEditMode ? 'Update Details' : 'Add Employee',
          type: 'primary',
          onClick: handleSubmit,
          loading: loading,
          disabled: !isFormValid,
        },
      ]}
    >
      <Form form={form} layout="vertical">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 32,
          padding: '0 20px'
        }}>
          <Steps
            current={currentStep}
            items={stepItems}
            size="small"
            style={{
              maxWidth: '700px',
              width: '100%'
            }}
            labelPlacement="vertical"
          />
        </div>

        <div style={{ minHeight: '400px', padding: '20px 0' }}>
          {renderStepContent()}
        </div>

        <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 24 }}>
          <Button
            disabled={currentStep === 0}
            onClick={handlePrev}
          >
            Previous
          </Button>
          {currentStep < stepItems.length - 1 && (
            <Button type="primary" onClick={handleNext}>
              Next
            </Button>
          )}
        </Space>
      </Form>
    </CustomModal>
  );
};

ResourceModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  isEditMode: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  form: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  tiers: PropTypes.array,
  designations: PropTypes.array,
  tracks: PropTypes.array,
  tags: PropTypes.array,
  employeeTypes: PropTypes.array,
  techStacks: PropTypes.array,
  universities: PropTypes.array,
};

ResourceModal.defaultProps = {
  tiers: [],
  designations: [],
  tracks: [],
  tags: [],
  employeeTypes: [],
  techStacks: [],
  universities: [],
};

export default ResourceModal;
