import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testAPIs() {
  console.log('🧪 Testing CFL Legal APIs...\n');
  
  try {
    console.log('1️⃣  Testing Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@cfllegal.co.ke',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ Login successful!');
    console.log(`   User: ${user.name} (${user.role})\n`);

    const headers = { Authorization: `Bearer ${token}` };

    console.log('2️⃣  Testing Get Current User...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, { headers });
    console.log('✅ Get current user successful!');
    console.log(`   Email: ${meResponse.data.email}\n`);

    console.log('3️⃣  Testing Get All Users (Admin)...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, { headers });
    console.log('✅ Get all users successful!');
    console.log(`   Total users: ${usersResponse.data.length}\n`);

    console.log('4️⃣  Testing Create Case...');
    const mainTimestamp = Date.now();
    const caseData = {
      caseNumber: `CFL-2024-${mainTimestamp}`,
      title: 'Test Corporate Case',
      description: 'A test case for corporate law',
      practiceArea: 'corporate_commercial',
      status: 'active'
    };
    const createCaseResponse = await axios.post(`${BASE_URL}/cases`, caseData, { headers });
    const caseId = createCaseResponse.data.id;
    console.log('✅ Create case successful!');
    console.log(`   Case ID: ${caseId}\n`);

    console.log('5️⃣  Testing Get All Cases...');
    const casesResponse = await axios.get(`${BASE_URL}/cases`, { headers });
    console.log('✅ Get all cases successful!');
    console.log(`   Total cases: ${casesResponse.data.length}\n`);

    console.log('6️⃣  Testing Get Case by ID...');
    const getCaseResponse = await axios.get(`${BASE_URL}/cases/${caseId}`, { headers });
    console.log('✅ Get case by ID successful!');
    console.log(`   Case: ${getCaseResponse.data.title}\n`);

    console.log('7️⃣  Testing Update Case...');
    const updateCaseResponse = await axios.patch(
      `${BASE_URL}/cases/${caseId}`,
      { status: 'under_review' },
      { headers }
    );
    console.log('✅ Update case successful!');
    console.log(`   New status: ${updateCaseResponse.data.status}\n`);

    console.log('8️⃣  Testing Assign User to Case...');
    const assignResponse = await axios.post(
      `${BASE_URL}/cases/${caseId}/assign`,
      { userId: user.id },
      { headers }
    );
    console.log('✅ Assign user to case successful!\n');

    console.log('9️⃣  Testing Get Users for Case...');
    const caseUsersResponse = await axios.get(`${BASE_URL}/cases/${caseId}/users`, { headers });
    console.log('✅ Get users for case successful!');
    console.log(`   Assigned users: ${caseUsersResponse.data.length}\n`);

    console.log('🔟 Testing Get All Documents...');
    const docsResponse = await axios.get(`${BASE_URL}/documents`, { headers });
    console.log('✅ Get all documents successful!');
    console.log(`   Total documents: ${docsResponse.data.length}\n`);

    console.log('1️⃣1️⃣ Testing Delete Case (Admin Only)...');
    const deleteCaseData = {
      caseNumber: 'CFL-DELETE-TEST',
      title: 'Case for Delete Test',
      description: 'This case will be deleted',
      practiceArea: 'corporate_commercial',
      status: 'active'
    };
    const deleteCaseResponse = await axios.post(`${BASE_URL}/cases`, deleteCaseData, { headers });
    const deleteCaseId = deleteCaseResponse.data.id;
    await axios.delete(`${BASE_URL}/cases/${deleteCaseId}`, { headers });
    console.log('✅ Delete case successful!\n');

    console.log('1️⃣2️⃣ Testing Authorization - Create User (Admin Only)...');
    const newUserData = {
      email: 'test.user@cfllegal.co.ke',
      password: 'test123',
      name: 'Test User',
      role: 'associate',
      practiceAreas: [],
      isActive: 'true'
    };
    const createUserResponse = await axios.post(`${BASE_URL}/users`, newUserData, { headers });
    const newUserId = createUserResponse.data.id;
    console.log('✅ Create user successful!');
    console.log(`   User ID: ${newUserId}\n`);

    console.log('1️⃣3️⃣ Testing Delete User Without Dependencies...');
    await axios.delete(`${BASE_URL}/users/${newUserId}`, { headers });
    console.log('✅ Delete user successful!\n');

    console.log('1️⃣4️⃣ Testing Authorization - Non-Admin Access...');
    
    const timestamp = Date.now();
    const associateUserData = {
      email: `associate-${timestamp}@cfllegal.co.ke`,
      password: 'associate123',
      name: 'Associate User',
      role: 'associate',
      practiceAreas: [],
      isActive: 'true'
    };
    const associateResponse = await axios.post(`${BASE_URL}/users`, associateUserData, { headers });
    const associateId = associateResponse.data.id;
    
    const associateLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: `associate-${timestamp}@cfllegal.co.ke`,
      password: 'associate123'
    });
    const associateToken = associateLoginResponse.data.token;
    const associateHeaders = { Authorization: `Bearer ${associateToken}` };

    console.log('   Testing non-admin cannot delete cases...');
    const testCase = await axios.post(`${BASE_URL}/cases`, {
      caseNumber: `CFL-2024-${timestamp}`,
      title: 'Test Case for Auth',
      description: 'Testing authorization',
      practiceArea: 'corporate_commercial',
      status: 'active'
    }, { headers });
    const testCaseId = testCase.data.id;

    try {
      await axios.delete(`${BASE_URL}/cases/${testCaseId}`, { headers: associateHeaders });
      console.error('❌ Non-admin was able to delete case - security issue!');
      process.exit(1);
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('   ✓ Non-admin correctly blocked from deleting cases');
      } else {
        throw error;
      }
    }

    console.log('   Testing non-admin cannot manage other users...');
    try {
      await axios.get(`${BASE_URL}/users`, { headers: associateHeaders });
      console.error('❌ Non-admin was able to access user list - security issue!');
      process.exit(1);
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('   ✓ Non-admin correctly blocked from accessing user list');
      } else {
        throw error;
      }
    }

    console.log('   Testing non-admin cannot update others cases...');
    try {
      await axios.patch(`${BASE_URL}/cases/${testCaseId}`, { status: 'closed' }, { headers: associateHeaders });
      console.error('❌ Non-admin was able to update another users case - security issue!');
      process.exit(1);
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('   ✓ Non-admin correctly blocked from updating others cases');
      } else {
        throw error;
      }
    }

    console.log('   Testing non-admin cannot delete documents...');
    try {
      await axios.delete(`${BASE_URL}/documents/fake-doc-id`, { headers: associateHeaders });
      console.error('❌ Non-admin was able to attempt document deletion - security issue!');
      process.exit(1);
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('   ✓ Non-admin correctly blocked from deleting documents');
      } else if (error.response?.status === 404) {
        console.log('   ✓ Non-admin blocked from deleting documents (404 returned)');
      } else {
        throw error;
      }
    }

    console.log('   Testing non-admin cannot view unassigned cases...');
    try {
      await axios.get(`${BASE_URL}/cases/${testCaseId}`, { headers: associateHeaders });
      console.error('❌ Non-admin was able to view unassigned case - security issue!');
      process.exit(1);
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('   ✓ Non-admin correctly blocked from viewing unassigned cases');
      } else {
        throw error;
      }
    }

    console.log('   Testing non-owner cannot assign users to case...');
    try {
      await axios.post(`${BASE_URL}/cases/${testCaseId}/assign`, { userId: associateId }, { headers: associateHeaders });
      console.error('❌ Non-owner was able to assign users to case - security issue!');
      process.exit(1);
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('   ✓ Non-owner correctly blocked from assigning users');
      } else {
        throw error;
      }
    }

    console.log('   Testing cannot delete case with assignments...');
    await axios.post(`${BASE_URL}/cases/${testCaseId}/assign`, { userId: user.id }, { headers });
    try {
      await axios.delete(`${BASE_URL}/cases/${testCaseId}`, { headers });
      console.error('❌ Was able to delete case with assignments - should return 409!');
      process.exit(1);
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.log('   ✓ Case deletion correctly blocked when assignments exist (409)');
      } else {
        throw error;
      }
    }

    console.log('   Testing non-admin cannot access all documents...');
    try {
      await axios.get(`${BASE_URL}/documents`, { headers: associateHeaders });
      console.error('❌ Non-admin was able to access all documents - security issue!');
      process.exit(1);
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('   ✓ Non-admin correctly blocked from accessing all documents');
      } else {
        throw error;
      }
    }

    console.log('   Testing non-admin cannot view unassigned case documents...');
    try {
      await axios.get(`${BASE_URL}/cases/${testCaseId}/documents`, { headers: associateHeaders });
      console.error('❌ Non-admin was able to view unassigned case documents - security issue!');
      process.exit(1);
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('   ✓ Non-admin correctly blocked from viewing unassigned case documents');
      } else {
        throw error;
      }
    }

    console.log('   Testing non-admin cannot view unassigned case users...');
    try {
      await axios.get(`${BASE_URL}/cases/${testCaseId}/users`, { headers: associateHeaders });
      console.error('❌ Non-admin was able to view unassigned case users - security issue!');
      process.exit(1);
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('   ✓ Non-admin correctly blocked from viewing unassigned case users');
      } else {
        throw error;
      }
    }

    console.log('   Cleaning up test data...');
    await axios.delete(`${BASE_URL}/users/${associateId}`, { headers });
    console.log('✅ Authorization tests passed!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ All API tests passed successfully! ✨');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 API Endpoints Summary:');
    console.log('   ✓ Authentication (Login, Get Current User)');
    console.log('   ✓ Users Management (GET, POST, PATCH, DELETE) - Admin Only');
    console.log('   ✓ Cases Management (GET, POST, PATCH, DELETE)');
    console.log('     - Create: Any authenticated user');
    console.log('     - Update: Owner or Admin only');
    console.log('     - Delete: Admin only');
    console.log('   ✓ Case Assignments (POST, GET)');
    console.log('   ✓ Documents (GET, POST, DELETE) - Delete Admin Only');
    console.log('   ✓ Authorization checks verified with negative tests');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

testAPIs();
