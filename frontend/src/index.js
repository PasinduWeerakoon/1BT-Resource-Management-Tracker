import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import { store } from './redux/store';
import '@utils/chartConfig'; // Register Chart.js components
import '@styles/index.scss';

const { defaultAlgorithm } = theme;

const antdTheme = {
  algorithm: defaultAlgorithm,
  token: {
    colorPrimary: '#97230C',
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    borderRadius: 6,
  },
  components: {
    Button: {
      primaryColor: '#fff',
      colorPrimary: '#97230C',
      colorPrimaryHover: '#b82a0f',
      colorPrimaryActive: '#7a1c09',
    },
    Layout: {
      bodyBg: '#fff',
      headerBg: '#fff',
      footerBg: '#fff',
      siderBg: '#fff',
    },
    Menu: {
      itemSelectedBg: '#f5f5f5',
      itemSelectedColor: '#262626',
      itemHoverBg: '#f5f5f5',
      itemHoverColor: '#262626',
      itemColor: '#262626',
    },
    Table: {
      headerBg: '#fafafa',
      headerColor: '#262626',
    },
  },
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ConfigProvider theme={antdTheme}>
          <App />
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
