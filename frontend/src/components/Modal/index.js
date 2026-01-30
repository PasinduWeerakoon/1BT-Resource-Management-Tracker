import React from 'react';
import { Modal as AntModal, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import '@styles/components/Modal.scss';

const CustomModal = ({
    open,
    onClose,
    title,
    children,
    width = 800,
    buttons = [],
    className = '',
    ...restProps
}) => {
    return (
        <AntModal
            open={open}
            onCancel={onClose}
            footer={null}
            width={width}
            className={`custom-modal ${className}`}
            closeIcon={null}
            centered
            maskClosable={false}
            {...restProps}
        >
            <div className="custom-modal-container">
                {/* Header */}
                <div className="custom-modal-header">
                    <h3 className="custom-modal-title">{title}</h3>
                    <button
                        type="button"
                        className="custom-modal-close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <CloseOutlined />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="custom-modal-content">
                    {children}
                </div>

                {/* Footer with Configurable Buttons */}
                {buttons && buttons.length > 0 && (
                    <div className="custom-modal-footer">
                        {buttons.map((button, index) => {
                            // Map button.type to className for custom styling
                            const buttonTypeClass = button.type === 'primary' ? 'primary' : 
                                                   button.type === 'danger' ? 'danger' : 
                                                   button.type === 'dashed' ? 'dashed' : 
                                                   button.type === 'text' ? 'text' : '';
                            
                            return (
                                <Button
                                    key={index}
                                    type="default" // Always use default type, styling comes from className
                                    htmlType={button.htmlType || 'button'}
                                    className={`custom-modal-button ${buttonTypeClass} ${button.className || ''}`}
                                    onClick={button.onClick}
                                    disabled={button.disabled}
                                    loading={button.loading}
                                    icon={button.icon}
                                >
                                    {button.text}
                                </Button>
                            );
                        })}
                    </div>
                )}
            </div>
        </AntModal>
    );
};

export default CustomModal;
