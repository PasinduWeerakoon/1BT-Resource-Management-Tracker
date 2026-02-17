/**
 * LoginHeader Component
 * Header section for login page
 */

import React from 'react';
import { Typography } from 'antd';
import PropTypes from 'prop-types';

const { Title, Text } = Typography;

/**
 * LoginHeader Component
 * @param {Object} props
 * @param {string} props.title - Title text (default: '1billiontech')
 * @param {string} props.subtitle - Subtitle text (default: 'Sign in to your account')
 */
const LoginHeader = ({
  title = '1billiontech',
  subtitle = 'Sign in to your account',
}) => {
  return (
    <div className="login-header">
      <Title level={2}>{title}</Title>
      <Text type="secondary">{subtitle}</Text>
    </div>
  );
};

LoginHeader.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

export default LoginHeader;
