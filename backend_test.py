#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class AcademicCRMTester:
    def __init__(self, base_url="https://curriculum-master-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", endpoint=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "endpoint": endpoint
        })

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request and return response"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            return success, response
        except Exception as e:
            return False, str(e)

    def test_admin_login(self):
        """Test admin login functionality"""
        success, response = self.make_request(
            'POST', 
            'auth/login',
            data={"email": "admin@raffles.edu.in", "password": "admin123"},
            expected_status=200
        )
        
        if success:
            try:
                data = response.json()
                if 'id' in data and data.get('role') == 'admin':
                    self.log_test("Admin Login", True, endpoint="POST /api/auth/login")
                    return True
                else:
                    self.log_test("Admin Login", False, "Invalid response format", "POST /api/auth/login")
            except:
                self.log_test("Admin Login", False, "Invalid JSON response", "POST /api/auth/login")
        else:
            self.log_test("Admin Login", False, f"Status: {response.status_code}", "POST /api/auth/login")
        
        return False

    def test_auth_me(self):
        """Test get current user endpoint"""
        success, response = self.make_request('GET', 'auth/me')
        
        if success:
            try:
                data = response.json()
                if 'email' in data and 'role' in data:
                    self.log_test("Get Current User", True, endpoint="GET /api/auth/me")
                    return True
            except:
                pass
        
        self.log_test("Get Current User", False, f"Status: {response.status_code if hasattr(response, 'status_code') else 'Request failed'}", "GET /api/auth/me")
        return False

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, response = self.make_request('GET', 'dashboard/stats')
        
        if success:
            try:
                data = response.json()
                required_fields = ['total_students', 'total_faculty', 'total_departments', 'total_programs', 'total_subjects']
                if all(field in data for field in required_fields):
                    self.log_test("Dashboard Stats", True, endpoint="GET /api/dashboard/stats")
                    return True
                else:
                    self.log_test("Dashboard Stats", False, "Missing required fields", "GET /api/dashboard/stats")
            except:
                self.log_test("Dashboard Stats", False, "Invalid JSON response", "GET /api/dashboard/stats")
        else:
            self.log_test("Dashboard Stats", False, f"Status: {response.status_code if hasattr(response, 'status_code') else 'Request failed'}", "GET /api/dashboard/stats")
        
        return False

    def test_departments_crud(self):
        """Test departments CRUD operations"""
        # Test GET departments
        success, response = self.make_request('GET', 'departments')
        if success:
            self.log_test("Get Departments", True, endpoint="GET /api/departments")
        else:
            self.log_test("Get Departments", False, f"Status: {response.status_code if hasattr(response, 'status_code') else 'Request failed'}", "GET /api/departments")
            return False

        # Test CREATE department
        dept_data = {
            "name": "Test Department",
            "code": f"TEST{datetime.now().strftime('%H%M%S')}"
        }
        success, response = self.make_request('POST', 'departments', data=dept_data, expected_status=200)
        
        if success:
            try:
                dept = response.json()
                if 'id' in dept:
                    self.log_test("Create Department", True, endpoint="POST /api/departments")
                    return dept['id']
                else:
                    self.log_test("Create Department", False, "No ID in response", "POST /api/departments")
            except:
                self.log_test("Create Department", False, "Invalid JSON response", "POST /api/departments")
        else:
            self.log_test("Create Department", False, f"Status: {response.status_code if hasattr(response, 'status_code') else 'Request failed'}", "POST /api/departments")
        
        return None

    def test_programs_crud(self, dept_id):
        """Test programs CRUD operations"""
        if not dept_id:
            self.log_test("Programs CRUD", False, "No department ID available", "")
            return None

        # Test GET programs
        success, response = self.make_request('GET', 'programs')
        if success:
            self.log_test("Get Programs", True, endpoint="GET /api/programs")
        else:
            self.log_test("Get Programs", False, f"Status: {response.status_code if hasattr(response, 'status_code') else 'Request failed'}", "GET /api/programs")

        # Test CREATE program
        prog_data = {
            "name": "Test Program",
            "code": f"TP{datetime.now().strftime('%H%M%S')}",
            "department_id": dept_id,
            "duration_years": 4,
            "total_semesters": 8
        }
        success, response = self.make_request('POST', 'programs', data=prog_data, expected_status=200)
        
        if success:
            try:
                prog = response.json()
                if 'id' in prog:
                    self.log_test("Create Program", True, endpoint="POST /api/programs")
                    return prog['id']
                else:
                    self.log_test("Create Program", False, "No ID in response", "POST /api/programs")
            except:
                self.log_test("Create Program", False, "Invalid JSON response", "POST /api/programs")
        else:
            self.log_test("Create Program", False, f"Status: {response.status_code if hasattr(response, 'status_code') else 'Request failed'}", "POST /api/programs")
        
        return None

    def test_students_crud(self, prog_id):
        """Test students CRUD operations"""
        if not prog_id:
            self.log_test("Students CRUD", False, "No program ID available", "")
            return None

        # Test GET students
        success, response = self.make_request('GET', 'students')
        if success:
            self.log_test("Get Students", True, endpoint="GET /api/students")
        else:
            self.log_test("Get Students", False, f"Status: {response.status_code if hasattr(response, 'status_code') else 'Request failed'}", "GET /api/students")

        # Test CREATE student
        timestamp = datetime.now().strftime('%H%M%S')
        student_data = {
            "name": "Test Student",
            "enrollment_number": f"EN{timestamp}",
            "email": f"test{timestamp}@student.raffles.edu.in",
            "program_id": prog_id,
            "academic_session": "2024-25",
            "semester": 1
        }
        success, response = self.make_request('POST', 'students', data=student_data, expected_status=200)
        
        if success:
            try:
                student = response.json()
                if 'id' in student:
                    self.log_test("Create Student", True, endpoint="POST /api/students")
                    return student['id']
                else:
                    self.log_test("Create Student", False, "No ID in response", "POST /api/students")
            except:
                self.log_test("Create Student", False, "Invalid JSON response", "POST /api/students")
        else:
            self.log_test("Create Student", False, f"Status: {response.status_code if hasattr(response, 'status_code') else 'Request failed'}", "POST /api/students")
        
        return None

    def test_subjects_crud(self, prog_id):
        """Test subjects CRUD operations"""
        if not prog_id:
            self.log_test("Subjects CRUD", False, "No program ID available", "")
            return None

        # Test GET subjects
        success, response = self.make_request('GET', 'subjects')
        if success:
            self.log_test("Get Subjects", True, endpoint="GET /api/subjects")
        else:
            self.log_test("Get Subjects", False, f"Status: {response.status_code if hasattr(response, 'status_code') else 'Request failed'}", "GET /api/subjects")

        # Test CREATE subject
        subj_data = {
            "name": "Test Subject",
            "code": f"TS{datetime.now().strftime('%H%M%S')}",
            "credits": 3,
            "subject_type": "core",
            "program_id": prog_id,
            "semester": 1
        }
        success, response = self.make_request('POST', 'subjects', data=subj_data, expected_status=200)
        
        if success:
            try:
                subj = response.json()
                if 'id' in subj:
                    self.log_test("Create Subject", True, endpoint="POST /api/subjects")
                    return subj['id']
                else:
                    self.log_test("Create Subject", False, "No ID in response", "POST /api/subjects")
            except:
                self.log_test("Create Subject", False, "Invalid JSON response", "POST /api/subjects")
        else:
            self.log_test("Create Subject", False, f"Status: {response.status_code if hasattr(response, 'status_code') else 'Request failed'}", "POST /api/subjects")
        
        return None

    def test_other_endpoints(self):
        """Test other important endpoints"""
        endpoints = [
            ('GET', 'timetable', 200),
            ('GET', 'attendance', 200),
            ('GET', 'batches', 200),
            ('GET', 'users', 200),
            ('GET', 'electives', 200)
        ]
        
        for method, endpoint, expected_status in endpoints:
            success, response = self.make_request(method, endpoint, expected_status=expected_status)
            endpoint_name = endpoint.replace('/', ' ').title()
            if success:
                self.log_test(f"Get {endpoint_name}", True, endpoint=f"{method} /api/{endpoint}")
            else:
                self.log_test(f"Get {endpoint_name}", False, f"Status: {response.status_code if hasattr(response, 'status_code') else 'Request failed'}", f"{method} /api/{endpoint}")

    def test_logout(self):
        """Test logout functionality"""
        success, response = self.make_request('POST', 'auth/logout')
        if success:
            self.log_test("Logout", True, endpoint="POST /api/auth/logout")
        else:
            self.log_test("Logout", False, f"Status: {response.status_code if hasattr(response, 'status_code') else 'Request failed'}", "POST /api/auth/logout")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Academic CRM Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Test authentication first
        if not self.test_admin_login():
            print("❌ Cannot proceed without admin login")
            return False

        # Test auth endpoints
        self.test_auth_me()
        
        # Test dashboard
        self.test_dashboard_stats()
        
        # Test CRUD operations
        dept_id = self.test_departments_crud()
        prog_id = self.test_programs_crud(dept_id)
        student_id = self.test_students_crud(prog_id)
        subject_id = self.test_subjects_crud(prog_id)
        
        # Test other endpoints
        self.test_other_endpoints()
        
        # Test logout
        self.test_logout()

        # Print summary
        print("=" * 60)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        return success_rate > 80

def main():
    tester = AcademicCRMTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())