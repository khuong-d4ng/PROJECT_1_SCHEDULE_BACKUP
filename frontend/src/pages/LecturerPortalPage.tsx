import React, { useState, useEffect, useMemo } from 'react';
import { Card, Tag, Button, Checkbox, Radio, message, Spin, Empty, Badge } from 'antd';
import { CheckCircleFilled, BookOutlined, SendOutlined, EyeOutlined } from '@ant-design/icons';
import apiClient from '../api/client';

interface SubjectItem {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  credits: number;
  theory_hours: number;
  practice_hours: number;
}

interface OpenList {
  list_id: number;
  list_name: string;
  description?: string;
  created_at: string;
  subjects: SubjectItem[];
}

interface MyRegistration {
  registration_id: number;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  is_main_lecturer: boolean;
}

const LecturerPortalPage: React.FC = () => {
  const [openLists, setOpenLists] = useState<OpenList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<OpenList | null>(null);
  const [myRegistrations, setMyRegistrations] = useState<MyRegistration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  // Track current selections: subject_id -> { checked, is_main }
  const [selections, setSelections] = useState<Record<number, { checked: boolean; is_main: boolean }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOpenLists();
  }, []);

  const fetchOpenLists = async () => {
    try {
      const res = await apiClient.get('/lecturer-portal/open-lists');
      setOpenLists(res.data);
    } catch {
      message.error('Không thể tải danh sách đợt đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const selectList = async (list: OpenList) => {
    setSelectedList(list);
    setLoadingRegs(true);
    try {
      const res = await apiClient.get(`/lecturer-portal/my-registrations?list_id=${list.list_id}`);
      setMyRegistrations(res.data);
      // Initialize selections from existing registrations
      const sels: Record<number, { checked: boolean; is_main: boolean }> = {};
      for (const subj of list.subjects) {
        const existing = res.data.find((r: MyRegistration) => r.subject_id === subj.subject_id);
        sels[subj.subject_id] = {
          checked: !!existing,
          is_main: existing ? existing.is_main_lecturer : true,
        };
      }
      setSelections(sels);
    } catch {
      message.error('Không thể tải nguyện vọng đã đăng ký');
    } finally {
      setLoadingRegs(false);
    }
  };

  const toggleSubject = (subjectId: number) => {
    setSelections((prev) => ({
      ...prev,
      [subjectId]: { ...prev[subjectId], checked: !prev[subjectId]?.checked },
    }));
  };

  const setRole = (subjectId: number, isMain: boolean) => {
    setSelections((prev) => ({
      ...prev,
      [subjectId]: { ...prev[subjectId], is_main: isMain },
    }));
  };

  const selectedCount = useMemo(() => {
    return Object.values(selections).filter((s) => s.checked).length;
  }, [selections]);

  const handleSave = async () => {
    if (!selectedList) return;
    const subjects = Object.entries(selections)
      .filter(([, v]) => v.checked)
      .map(([k, v]) => ({
        subject_id: parseInt(k),
        is_main_lecturer: v.is_main,
      }));

    setSaving(true);
    try {
      await apiClient.post('/lecturer-portal/register', {
        list_id: selectedList.list_id,
        subjects,
      });
      message.success(`Đã lưu ${subjects.length} nguyện vọng thành công!`);
      // Refresh registrations
      const res = await apiClient.get(`/lecturer-portal/my-registrations?list_id=${selectedList.list_id}`);
      setMyRegistrations(res.data);
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Lỗi khi lưu nguyện vọng');
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    setSelectedList(null);
    setSelections({});
    setMyRegistrations([]);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  // ─── DETAIL VIEW: Subject list for a selected registration period ───
  if (selectedList) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <Button onClick={goBack}>← Quay lại</Button>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{selectedList.list_name}</h2>
            {selectedList.description && (
              <span style={{ fontSize: '13px', color: '#888', marginTop: '4px', display: 'block' }}>
                {selectedList.description}
              </span>
            )}
          </div>
        </div>

        <Spin spinning={loadingRegs}>
          {selectedList.subjects.length === 0 ? (
            <Empty description="Đợt đăng ký này chưa có học phần nào" />
          ) : (
            <>
              {/* Summary bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #fff7ed, #fff1e0)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  border: '1px solid #fed7aa',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#9a3412' }}>
                  Đã chọn: <strong>{selectedCount}</strong> / {selectedList.subjects.length} môn
                </span>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSave}
                  loading={saving}
                  style={{
                    background: 'linear-gradient(135deg, #f37423, #ff9a56)',
                    border: 'none',
                    fontWeight: 600,
                  }}
                >
                  Lưu nguyện vọng
                </Button>
              </div>

              {/* Subject cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedList.subjects.map((subj) => {
                  const sel = selections[subj.subject_id] || { checked: false, is_main: true };
                  const wasRegistered = myRegistrations.some((r) => r.subject_id === subj.subject_id);

                  return (
                    <div
                      key={subj.subject_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '14px 20px',
                        borderRadius: '10px',
                        border: sel.checked
                          ? '2px solid #f37423'
                          : '1px solid #e5e7eb',
                        background: sel.checked ? '#fff8f3' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => toggleSubject(subj.subject_id)}
                    >
                      <Checkbox
                        checked={sel.checked}
                        style={{ marginRight: '16px' }}
                        onChange={() => {}} // handled by div onClick
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1f2937' }}>
                          {subj.subject_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          {subj.subject_code} • {subj.credits} TC •{' '}
                          LT: {subj.theory_hours}h • TH: {subj.practice_hours}h
                        </div>
                      </div>

                      {/* Role selector */}
                      {sel.checked && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{ marginRight: '16px' }}
                        >
                          <Radio.Group
                            value={sel.is_main ? 'main' : 'practice'}
                            onChange={(e) =>
                              setRole(subj.subject_id, e.target.value === 'main')
                            }
                            size="small"
                          >
                            <Radio.Button value="main">Lý thuyết</Radio.Button>
                            <Radio.Button value="practice">Thực hành</Radio.Button>
                          </Radio.Group>
                        </div>
                      )}

                      {wasRegistered && (
                        <Tag
                          icon={<CheckCircleFilled />}
                          color="success"
                          style={{ fontSize: '11px' }}
                        >
                          Đã đăng ký
                        </Tag>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Spin>
      </div>
    );
  }

  // ─── LIST VIEW: Open registration periods ───
  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
        Đăng ký Nguyện vọng Giảng dạy
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
        Chọn 1 đợt đăng ký để xem danh sách môn và đăng ký nguyện vọng dạy.
      </p>

      {openLists.length === 0 ? (
        <Empty
          description="Hiện chưa có đợt đăng ký nào được mở"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '60px 0' }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {openLists.map((list) => (
            <Card
              key={list.list_id}
              hoverable
              onClick={() => selectList(list)}
              style={{
                borderRadius: '14px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>
                    {list.list_name}
                  </h3>
                  {list.description && (
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px 0' }}>
                      {list.description}
                    </p>
                  )}
                </div>
                <Badge
                  count={
                    <Tag color="green" style={{ fontSize: '11px', fontWeight: 600 }}>
                      Đang mở
                    </Tag>
                  }
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4b5563' }}>
                  <BookOutlined style={{ color: '#f37423' }} />
                  <span><strong>{list.subjects.length}</strong> học phần</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4b5563' }}>
                  <EyeOutlined style={{ color: '#3b82f6' }} />
                  <span>Nhấn để xem</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LecturerPortalPage;
