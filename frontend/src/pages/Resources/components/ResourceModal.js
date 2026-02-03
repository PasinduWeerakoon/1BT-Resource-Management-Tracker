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
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFormValid, setIsFormValid] = useState(false);

  // Tech stack options
  const techStacks = ['.NET', 'Full Stack', 'QA', 'BA/PM', 'Data Science', 'Java', 'React'];

  // Watch required fields to determine if form is valid
  const name = Form.useWatch('name', form);
  const email = Form.useWatch('email', form);
  const mobile = Form.useWatch('mobile', form);
  const bod = Form.useWatch('bod', form);
  const nicOrPassport = Form.useWatch('nicOrPassport', form);
  const employeeNumber = Form.useWatch('employeeNumber', form);
  const employee_id = Form.useWatch('employee_id', form);
  const is_internal_employee = Form.useWatch('is_internal_employee', form);
  const employment_type = Form.useWatch('employment_type', form);
  const designation_id = Form.useWatch('designation_id', form);
  const tier = Form.useWatch('tier', form);
  const track_id = Form.useWatch('track_id', form);
  const joinDate = Form.useWatch('joinDate', form);
  const status = Form.useWatch('status', form);

  // Check if all required fields are filled
  useEffect(() => {
    const checkFormValidity = async () => {
      try {
        // Get all required fields based on mode
        const requiredFields = isEditMode
          ? ['name', 'email', 'mobile', 'bod', 'nicOrPassport', 'employeeNumber', 'is_internal_employee', 'employment_type', 'designation_id', 'tier', 'track_id', 'joinDate', 'status']
          : ['name', 'email', 'mobile', 'bod', 'nicOrPassport', 'employee_id', 'employeeNumber', 'is_internal_employee', 'employment_type', 'designation_id', 'tier', 'track_id', 'joinDate'];

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
          if (field === 'bod' || field === 'joinDate') {
            return value && value.isValid && value.isValid();
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
  }, [name, email, mobile, bod, nicOrPassport, employeeNumber, employee_id, is_internal_employee, employment_type, designation_id, tier, track_id, joinDate, status, isEditMode, form]);

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
      0: ['name', 'email', 'mobile', 'bod', 'nicOrPassport'], // Personal Info
      1: isEditMode
        ? ['employeeNumber', 'is_internal_employee', 'employment_type', 'designation_id', 'tier', 'track_id', 'joinDate', 'status']
        : ['employee_id', 'employeeNumber', 'is_internal_employee', 'employment_type', 'designation_id', 'tier', 'track_id', 'joinDate'], // Employment
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
      name: 0, email: 0, mobile: 0, bod: 0, nicOrPassport: 0, epf_no: 0, global_employeeid: 0, photo: 0,
      employee_id: 1, employeeNumber: 1, is_internal_employee: 1, employment_type: 1, designation_id: 1,
      tier: 1, track_id: 1, tech_stack: 1, joinDate: 1, last_increment_date: 1, last_promotion_date: 1, status: 1,
      university: 2, is_intern: 2, internship_completion_target_date: 2,
      total_allocation: 3, total_resource_billing: 3,
      tag_ids: 4, helper_id: 4, helper: 4,
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
          />
        );
      case 2:
        return <EducationInternshipStep form={form} />;
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
          {currentStep < stepItems.length - 1 ? (
            <Button type="primary" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={!isFormValid}
            >
              {isEditMode ? 'Update Details' : 'Add Employee'}
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
};

ResourceModal.defaultProps = {
  tiers: [],
  designations: [],
  tracks: [],
  tags: [],
};

export default ResourceModal;
