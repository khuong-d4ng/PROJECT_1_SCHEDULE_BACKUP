import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, message, Popconfirm, Tag, Space, Card, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined, SafetyCertificateOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import apiClient from '../api/client';

interface LecturerProfile {
  lecturer_id: number;
  lecturer_code: string;
  full_name: string;
}

interface UserItem {
  user_id: number;
  username: string;
  email: string | null;
  role: string;
  receive_emails: boolean;
  lecturer_profile: LecturerProfile | null;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users/');
      setUsers(res.data);
    } catch {
      message.error('Lỗi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setModalMode('edit');
    setSelectedUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
      receive_emails: user.receive_emails,
      password: '', // keep blank to optional
    });
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await apiClient.delete(`/users/${userId}`);
      message.success('Đã xóa tài khoản thành công');
      fetchUsers();
    } catch (e: any) {
      message.error(e.response?.data?.detail || 'Lỗi khi xóa tài khoản');
    }
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      
      if (modalMode === 'create') {
        await apiClient.post('/users/', values);
        message.success('Đã tạo tài khoản mới thành công');
      } else {
        if (selectedUser) {
          // Send only modified fields or standard edit
          await apiClient.put(`/users/${selectedUser.user_id}`, {
            username: values.username,
            email: values.email,
            role: values.role,
            receive_emails: values.receive_emails,
            password: values.password || undefined // skip if blank
          });
          message.success('Đã cập nhật thông tin tài khoản thành công');
        }
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (e: any) {
      if (e.errorFields) return; // validation failed
      message.error(e.response?.data?.detail || 'Lỗi xử lý yêu cầu');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getRoleTagColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'volcano';
      case 'Cán bộ xếp lịch':
        return 'blue';
      case 'Giảng viên':
        return 'green';
      default:
        return 'default';
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchText.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchText.toLowerCase())) ||
    (u.lecturer_profile && u.lecturer_profile.full_name.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => (
        <Space>
          <UserOutlined style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 600 }}>{text}</span>
        </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text: string | null) => text ? (
        <span style={{ fontSize: '13px' }}>
          <MailOutlined className="mr-1 text-slate-400" /> {text}
        </span>
      ) : <span className="text-slate-400 italic">Chưa liên kết</span>
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleTagColor(role)} style={{ fontWeight: 500 }}>
          {role}
        </Tag>
      )
    },
    {
      title: 'Hồ sơ Giảng viên',
      key: 'lecturer_profile',
      render: (_: any, record: UserItem) => record.lecturer_profile ? (
        <Tooltip title={`Mã GV: ${record.lecturer_profile.lecturer_code}`}>
          <Tag color="cyan" style={{ border: '1px solid #5cdbd3' }}>
            {record.lecturer_profile.full_name} ({record.lecturer_profile.lecturer_code})
          </Tag>
        </Tooltip>
      ) : record.role === 'Giảng viên' ? (
        <span className="text-amber-500 italic text-xs">Chưa tạo hồ sơ</span>
      ) : (
        <span className="text-slate-400">-</span>
      )
    },
    {
      title: 'Nhận Email',
      dataIndex: 'receive_emails',
      key: 'receive_emails',
      align: 'center' as const,
      render: (val: boolean) => (
        <Tag color={val ? 'success' : 'default'}>
          {val ? 'Đang Bật' : 'Đã Tắt'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: UserItem) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa tài khoản">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>
          
          <Popconfirm
            title="Xác nhận xóa tài khoản?"
            description={
              record.role === 'Giảng viên' 
                ? "Tài khoản này liên kết với hồ sơ giảng viên. Nếu xóa, hồ sơ giảng viên liên quan cũng sẽ bị xóa (nếu chưa có dữ liệu thời khóa biểu)."
                : "Hành động này không thể hoàn tác."
            }
            onConfirm={() => handleDeleteUser(record.user_id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa tài khoản">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ height: '100%' }}>
      <Card
        hoverable
        style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
          transition: 'none'
        }}
      >
        {/* Header */}
        <div style={{ padding: '4px 8px 16px 8px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SafetyCertificateOutlined style={{ color: 'var(--color-primary)' }} />
              Quản lý Tài khoản & Phân quyền
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Danh sách tài khoản hệ thống ({filteredUsers.length} tài khoản)
            </span>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
            style={{ fontWeight: 600 }}
          >
            Thêm Tài khoản
          </Button>
        </div>

        {/* Search tool */}
        <div style={{ padding: '16px 8px 12px 8px' }}>
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--color-text-muted)' }} />}
            placeholder="Tìm theo tên đăng nhập, email hoặc tên giảng viên..."
            allowClear
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ maxWidth: 420 }}
            name="search-users"
            autoComplete="off"
          />
        </div>

        {/* Table View */}
        <div style={{ padding: '0 8px 8px 8px' }}>
          <Table
            dataSource={filteredUsers}
            columns={columns}
            rowKey="user_id"
            loading={loading}
            size="middle"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            bordered
          />
        </div>
      </Card>

      {/* Modal CREATE/EDIT USER */}
      <Modal
        title={
          <span style={{ fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserOutlined style={{ color: 'var(--color-primary)' }} />
            {modalMode === 'create' ? 'Tạo Tài khoản mới' : 'Chỉnh sửa tài khoản'}
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleFormSubmit}
        confirmLoading={submitLoading}
        okText={modalMode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
        cancelText="Hủy"
        width={520}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: '16px' }}
          initialValues={{ role: 'Cán bộ xếp lịch', receive_emails: true }}
        >
          <Form.Item
            name="username"
            label="Tên đăng nhập (*)"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập' },
              { min: 3, message: 'Tên đăng nhập phải chứa ít nhất 3 ký tự' }
            ]}
          >
            <Input 
              placeholder="Nhập tên đăng nhập" 
              disabled={modalMode === 'edit'} 
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} 
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={modalMode === 'create' ? "Mật khẩu (*)" : "Mật khẩu mới (Không bắt buộc)"}
            rules={
              modalMode === 'create' 
                ? [
                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                    { min: 6, message: 'Mật khẩu phải chứa ít nhất 6 ký tự' }
                  ]
                : []
            }
          >
            <Input.Password 
              placeholder={modalMode === 'create' ? "Nhập mật khẩu (tối thiểu 6 ký tự)" : "Để trống nếu không muốn thay đổi"} 
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Địa chỉ Email"
            rules={[{ type: 'email', message: 'Vui lòng nhập đúng định dạng Email' }]}
          >
            <Input 
              placeholder="Nhập địa chỉ email liên hệ" 
              prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} 
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò hệ thống"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select placeholder="Chọn vai trò">
              <Select.Option value="Admin">Admin (Quản trị hệ thống)</Select.Option>
              <Select.Option value="Cán bộ xếp lịch">Cán bộ xếp lịch (Giáo vụ Khoa)</Select.Option>
              <Select.Option value="Giảng viên">Giảng viên (Portal cá nhân)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="receive_emails"
            label="Nhận thông báo qua Email"
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>

          {modalMode === 'create' && (
            <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '12.5px', color: '#d46b08' }}>
              <strong>Lưu ý:</strong> Đối với vai trò <strong>Giảng viên</strong>, tài khoản nên được tạo tự động thông qua chức năng quản lý danh sách giảng viên để được tự động đồng bộ mã giảng viên và hồ sơ cá nhân.
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
