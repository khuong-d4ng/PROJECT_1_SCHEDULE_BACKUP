import sys
sys.stdout.reconfigure(encoding='utf-8')
import urllib.request
import json

base_url = 'http://127.0.0.1:8000/api'

def req(url, method='GET', data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(base_url + url, data=json.dumps(data).encode('utf-8') if data else None, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f'Error {e.code}: {e.read().decode("utf-8")}')
        return None

print('--- Get Subjects ---')
subjects_list = req('/subjects/')
if not subjects_list:
    print('No subjects found or error')
    sys.exit()
subject_ids = [s['subject_id'] for s in subjects_list[:3]]
print(f'Found Subject IDs: {subject_ids}')

print('--- Login Admin ---')
admin_login = req('/auth/login', method='POST', data={'username': 'admin', 'password': 'admin123'})
admin_token = admin_login['access_token'] if admin_login else None
print('Admin Token:', bool(admin_token))

if admin_token:
    print('--- Create List ---')
    new_list = req('/registrations/lists', method='POST', data={'list_name': 'Test List Real Subj', 'semester_id': 1}, token=admin_token)
    print('Created List:', new_list)

    if new_list:
        list_id = new_list['list_id']
        print('--- Open List ---')
        open_res = req(f'/registrations/lists/{list_id}/toggle-open', method='PUT', token=admin_token)
        print('Toggle Open:', open_res)

        print('--- Set Subjects ---')
        set_subj_res = req(f'/registrations/lists/{list_id}/set-subjects', method='PUT', data={'subject_ids': subject_ids}, token=admin_token)
        print('Set Subjects:', set_subj_res)

print('--- Login Lecturer ---')
lec_login = req('/auth/login', method='POST', data={'username': 'DN01801853', 'password': '123456'})
lec_token = lec_login['access_token'] if lec_login else None
print('Lecturer Token:', bool(lec_token))

if lec_token:
    print('--- Get Open Lists ---')
    open_lists = req('/lecturer-portal/open-lists', token=lec_token)
    print('Open Lists Count:', len(open_lists) if open_lists else 0)
    
    if open_lists:
        list_id = open_lists[0]['list_id']
        print('--- Register Subjects ---')
        reg_data = {'list_id': list_id, 'subjects': [{'subject_id': subject_ids[0], 'is_main_lecturer': True}]}
        reg_res = req('/lecturer-portal/register', method='POST', data=reg_data, token=lec_token)
        print('Register Res:', reg_res)
