/**
 * ResourceModal Component
 * Add/Edit Employee form modal with multi-step form
 */

import React, { useState } from 'react';
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

  // Handle step navigation - no validation
  const handleNext = () => {
    if (currentStep < stepItems.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submit - validate then submit
  const handleSubmit = async () => {
    try {
      await form.validateFields();
      onSubmit();
      setCurrentStep(0);
    } catch (error) {
      console.error('Form validation failed:', error);
      // Show validation errors but don't block - user can fix and retry
    }
  };

  // Reset step when modal closes
  const handleClose = () => {
    setCurrentStep(0);
    onClose();
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

        {/* Render ALL steps but hide inactive ones - keeps form values preserved */}
        <div style={{ minHeight: '400px', padding: '20px 0' }}>
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            <PersonalInfoStep form={form} isEditMode={isEditMode} />
          </div>
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <EmploymentDetailsStep
              form={form}
              isEditMode={isEditMode}
              designations={designations}
              tiers={tiers}
              tracks={tracks}
              techStacks={techStacks}
              employeeTypes={employeeTypes}
            />
          </div>
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            <EducationInternshipStep form={form} universities={universities} />
          </div>
          <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
            <BillingAllocationStep form={form} />
          </div>
          <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
            <AdditionalInfoStep form={form} tags={tags} />
          </div>
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
