import React from 'react';
import { Modal as AntModal } from 'antd';
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
                        {buttons.map((button, index) => (
                            <button
                                key={index}
                                type={button.htmlType || 'button'}
                                className={`custom-modal-button ${button.type || 'default'} ${button.className || ''}`}
                                onClick={button.onClick}
                                disabled={button.disabled}
                                loading={button.loading}
                            >
                                {button.icon && <span className="button-icon">{button.icon}</span>}
                                {button.text}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </AntModal>
    );
};

export default CustomModal;
