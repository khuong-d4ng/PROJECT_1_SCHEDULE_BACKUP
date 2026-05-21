import React, { useState } from 'react';
import { Button, Input, Form, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import apiClient from '../api/client';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', values);
      const { access_token, user } = res.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user_info', JSON.stringify(user));
      onLoginSuccess(access_token, user);
      message.success(`Xin chào, ${user.full_name || user.username}!`);
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    }}>
      <div style={{
        width: '420px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '48px 40px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Logo / Title */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #f37423, #ff9a56)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '28px', boxShadow: '0 8px 24px rgba(243, 116, 35, 0.3)',
          }}>
            🎓
          </div>
          <h1 style={{
            fontSize: '22px', fontWeight: 800, color: '#1a1a2e', margin: 0,
            letterSpacing: '-0.5px',
          }}>
            Quản lý Phân công TKB
          </h1>
          <p style={{ fontSize: '13px', color: '#8892a4', marginTop: '8px' }}>
            Đăng nhập để tiếp tục
          </p>
        </div>

        <Form onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#8892a4' }} />}
              placeholder="Tên đăng nhập"
              style={{
                borderRadius: '10px', height: '48px',
                border: '1.5px solid #e2e8f0',
                fontSize: '14px',
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#8892a4' }} />}
              placeholder="Mật khẩu"
              style={{
                borderRadius: '10px', height: '48px',
                border: '1.5px solid #e2e8f0',
                fontSize: '14px',
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '8px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: '48px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '15px',
                background: 'linear-gradient(135deg, #f37423, #ff9a56)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(243, 116, 35, 0.35)',
              }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div style={{
          textAlign: 'center', marginTop: '24px',
          fontSize: '11px', color: '#b0b8c8',
        }}>
          Phiên bản 1.0 — 2026
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
