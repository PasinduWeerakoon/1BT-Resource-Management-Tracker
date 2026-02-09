/**
 * ProjectModal Component
 * Thin wrapper: CustomModal + Form + ProjectForm for create/edit project
 */

import React from 'react';
import { Form } from 'antd';
import CustomModal from '@components/Modal';
import ProjectForm from '@pages/Configurations/Tabs/ProjectsTab/components/ProjectForm';

const ProjectModal = ({
  visible,
  isEditMode,
  onCancel,
  onSubmit,
  form,
  isSubmitting,
  billingType,
  setBillingType,
  accountType,
  setAccountType,
  clientsList,
  accountManagersList,
  projectTypesList,
  projectBillingStatuses,
  accountTypesList,
  projectStatusesList,
  loadingAccountManagers,
}) => {
  return (
    <CustomModal
      title={isEditMode ? 'Edit Project Details' : 'Create New Project'}
      open={visible}
      onClose={onCancel}
      width={800}
      buttons={[
        { text: 'Cancel', type: 'default', onClick: onCancel },
        {
          text: isEditMode ? 'Update Details' : 'Create Project',
          type: 'primary',
          onClick: () => form.submit(),
          loading: isSubmitting,
        },
      ]}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <ProjectForm
          form={form}
          isEditMode={isEditMode}
          accountTypeId={accountType}
          setAccountTypeId={setAccountType}
          clients={clientsList.map((c) => ({ id: c.id, name: c.client_name || c.name }))}
          accountManagersList={accountManagersList}
          projectTypesForModal={projectTypesList}
          billingStatusesForModal={projectBillingStatuses}
          accountTypesForModal={accountTypesList}
          projectStatusesForModal={projectStatusesList}
          loadingConfigForModal={false}
          loadingAccountManagers={loadingAccountManagers}
        />
      </Form>
    </CustomModal>
  );
};

export default React.memo(ProjectModal);
