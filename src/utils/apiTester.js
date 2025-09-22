// src/utils/apiTester.js - Comprehensive API testing utility
import api, { APIError } from '../services/api';

class APITester {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      skipped: []
    };
  }

  // Helper method to run a test
  async runTest(testName, testFn, options = {}) {
    const { skipOnError = false, requiresAuth = false } = options;
    
    try {
      console.log(`🧪 Testing: ${testName}`);
      
      if (requiresAuth && !api.isAuthenticated()) {
        this.results.skipped.push({
          name: testName,
          reason: 'No authentication token'
        });
        console.log(`⏭️  Skipped: ${testName} (No auth)`);
        return;
      }

      const startTime = Date.now();
      const result = await testFn();
      const endTime = Date.now();
      
      this.results.passed.push({
        name: testName,
        duration: endTime - startTime,
        result
      });
      
      console.log(`✅ Passed: ${testName} (${endTime - startTime}ms)`);
      return result;
    } catch (error) {
      this.results.failed.push({
        name: testName,
        error: error.message,
        status: error.status || 'Unknown'
      });
      
      console.log(`❌ Failed: ${testName} - ${error.message}`);
      
      if (skipOnError) {
        console.log('⏭️  Skipping dependent tests due to error');
        throw error;
      }
      
      return null;
    }
  }

  // Test system endpoints
  async testSystemEndpoints() {
    console.log('\n📡 Testing System Endpoints...');
    
    await this.runTest('Health Check', async () => {
      const response = await api.getHealthCheck();
      if (!response) throw new Error('No response from health check');
      return response;
    });

    await this.runTest('API Info', async () => {
      const response = await api.getApiInfo();
      if (!response) throw new Error('No response from API info');
      return response;
    });
  }

  // Test authentication endpoints
  async testAuthEndpoints() {
    console.log('\n🔐 Testing Authentication Endpoints...');
    
    // Test with invalid credentials first
    await this.runTest('Login with Invalid Credentials', async () => {
      try {
        await api.login('invalid@email.com', 'wrongpassword');
        throw new Error('Login should have failed with invalid credentials');
      } catch (error) {
        if (error instanceof APIError && (error.status === 401 || error.status === 400)) {
          return { message: 'Correctly rejected invalid credentials' };
        }
        throw error;
      }
    });

    // Test with valid test credentials
    let loginSuccess = false;
    await this.runTest('Login with Valid Credentials', async () => {
      const response = await api.login('admin@mining-ecommerce.com', 'Admin123!@#');
      if (!response.user) throw new Error('No user data in login response');
      loginSuccess = true;
      return response;
    }, { skipOnError: true });

    if (loginSuccess) {
      await this.runTest('Get User Profile', async () => {
        const response = await api.getProfile();
        if (!response.user && !response.data) throw new Error('No user data in profile response');
        return response;
      }, { requiresAuth: true });
    }
  }

  // Test product endpoints
  async testProductEndpoints() {
    console.log('\n📦 Testing Product Endpoints...');
    
    const products = await this.runTest('Get Products', async () => {
      const response = await api.getProducts({ limit: 10 });
      if (!Array.isArray(response.data) && !Array.isArray(response)) {
        throw new Error('Products response should be an array or contain data array');
      }
      return response;
    });

    if (products && (products.data || products).length > 0) {
      const productList = products.data || products;
      const firstProduct = productList[0];
      const productId = firstProduct.id || firstProduct._id;
      const productSku = firstProduct.sku;

      if (productId) {
        await this.runTest('Get Product by ID', async () => {
          const response = await api.getProductById(productId);
          if (!response) throw new Error('No product data returned');
          return response;
        });
      }

      if (productSku) {
        await this.runTest('Get Product by SKU', async () => {
          const response = await api.getProductBySku(productSku);
          if (!response) throw new Error('No product data returned');
          return response;
        });
      }
    }

    // Test create product (requires authentication)
    await this.runTest('Create Product', async () => {
      const formData = new FormData();
      formData.append('name', 'Test Mining Equipment');
      formData.append('description', 'Test product for API testing');
      formData.append('price', '1000');
      formData.append('category', 'Mining Equipment');
      formData.append('stock', '10');
      formData.append('sku', `TEST-${Date.now()}`);
      formData.append('active', 'true');
      
      const response = await api.createProduct(formData);
      if (!response) throw new Error('No response from create product');
      return response;
    }, { requiresAuth: true });
  }

  // Test order endpoints
  async testOrderEndpoints() {
    console.log('\n🛒 Testing Order Endpoints...');
    
    await this.runTest('Get Orders', async () => {
      const response = await api.getOrders({ limit: 10 });
      if (!Array.isArray(response.data) && !Array.isArray(response)) {
        throw new Error('Orders response should be an array or contain data array');
      }
      return response;
    }, { requiresAuth: true });

    // Test creating an order
    await this.runTest('Create Order', async () => {
      const orderData = {
        items: [
          {
            productId: '60f7b3b3b3b3b3b3b3b3b3b3', // Dummy product ID
            quantity: 1,
            price: 1000,
            currency: 'USD'
          }
        ],
        shippingAddress: {
          street: '123 Test Street',
          city: 'Harare',
          province: 'Harare',
          country: 'Zimbabwe',
          postalCode: '00263'
        },
        paymentMethod: 'card',
        currency: 'USD'
      };
      
      const response = await api.createOrder(orderData);
      if (!response) throw new Error('No response from create order');
      return response;
    }, { requiresAuth: true });
  }

  // Test user management endpoints
  async testUserEndpoints() {
    console.log('\n👥 Testing User Management Endpoints...');
    
    await this.runTest('Get Users', async () => {
      const response = await api.getUsers({ limit: 10 });
      if (!Array.isArray(response.data) && !Array.isArray(response)) {
        throw new Error('Users response should be an array or contain data array');
      }
      return response;
    }, { requiresAuth: true });

    await this.runTest('Create User', async () => {
      const userData = {
        name: 'Test User',
        email: `test-${Date.now()}@mining.com`,
        password: 'TestPass123!',
        role: 'customer',
        phone: '+263771234567'
      };
      
      const response = await api.createUser(userData);
      if (!response) throw new Error('No response from create user');
      return response;
    }, { requiresAuth: true });
  }

  // Test branch endpoints
  async testBranchEndpoints() {
    console.log('\n🏢 Testing Branch Endpoints...');
    
    const branches = await this.runTest('Get Branches', async () => {
      const response = await api.getBranches();
      if (!Array.isArray(response.data) && !Array.isArray(response)) {
        throw new Error('Branches response should be an array or contain data array');
      }
      return response;
    });

    if (branches && (branches.data || branches).length > 0) {
      const branchList = branches.data || branches;
      const firstBranch = branchList[0];
      const branchId = firstBranch.id || firstBranch._id;

      if (branchId) {
        await this.runTest('Get Branch by ID', async () => {
          const response = await api.getBranchById(branchId);
          if (!response) throw new Error('No branch data returned');
          return response;
        });
      }
    }

    await this.runTest('Create Branch', async () => {
      const branchData = {
        name: 'Test Branch',
        code: `TEST${Date.now()}`,
        location: {
          address: '123 Test Street',
          city: 'Harare',
          province: 'Harare',
          country: 'Zimbabwe'
        },
        contact: {
          phone: '+263771234567',
          email: 'test@mining.com'
        },
        currencies: {
          USD: { rate: 1, symbol: 'USD' },
          ZWG: { rate: 50, symbol: 'ZWG' }
        },
        status: 'active'
      };
      
      const response = await api.createBranch(branchData);
      if (!response) throw new Error('No response from create branch');
      return response;
    }, { requiresAuth: true });
  }

  // Test category endpoints
  async testCategoryEndpoints() {
    console.log('\n📂 Testing Category Endpoints...');
    
    await this.runTest('Get Categories', async () => {
      const response = await api.getCategories();
      if (!Array.isArray(response.data) && !Array.isArray(response)) {
        throw new Error('Categories response should be an array or contain data array');
      }
      return response;
    });

    await this.runTest('Create Category', async () => {
      const categoryData = {
        name: 'Test Category',
        description: 'Test category for API testing',
        slug: `test-category-${Date.now()}`,
        isActive: true
      };
      
      const response = await api.createCategory(categoryData);
      if (!response) throw new Error('No response from create category');
      return response;
    }, { requiresAuth: true });
  }

  // Test transaction endpoints
  async testTransactionEndpoints() {
    console.log('\n💳 Testing Transaction Endpoints...');
    
    await this.runTest('Get Transactions', async () => {
      const response = await api.getTransactions({ limit: 10 });
      if (!Array.isArray(response.data) && !Array.isArray(response)) {
        throw new Error('Transactions response should be an array or contain data array');
      }
      return response;
    }, { requiresAuth: true });
  }

  // Test report endpoints
  async testReportEndpoints() {
    console.log('\n📊 Testing Report Endpoints...');
    
    await this.runTest('Get Reports', async () => {
      const response = await api.getReports({ limit: 10 });
      if (!Array.isArray(response.data) && !Array.isArray(response)) {
        throw new Error('Reports response should be an array or contain data array');
      }
      return response;
    }, { requiresAuth: true });

    await this.runTest('Generate Sales Report', async () => {
      const reportData = {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };
      
      const response = await api.generateSalesReport(reportData);
      if (!response) throw new Error('No response from generate sales report');
      return response;
    }, { requiresAuth: true });

    await this.runTest('Generate Inventory Report', async () => {
      const response = await api.generateInventoryReport();
      if (!response) throw new Error('No response from generate inventory report');
      return response;
    }, { requiresAuth: true });
  }

  // Test audit endpoints
  async testAuditEndpoints() {
    console.log('\n🔍 Testing Audit Endpoints...');
    
    await this.runTest('Get Audit Logs', async () => {
      const response = await api.getAuditLogs({ limit: 10 });
      if (!Array.isArray(response.data) && !Array.isArray(response)) {
        throw new Error('Audit logs response should be an array or contain data array');
      }
      return response;
    }, { requiresAuth: true });

    await this.runTest('Get Audit Stats', async () => {
      const response = await api.getAuditStats();
      if (!response) throw new Error('No response from audit stats');
      return response;
    }, { requiresAuth: true });
  }

  // Test contact endpoints
  async testContactEndpoints() {
    console.log('\n📞 Testing Contact Endpoints...');
    
    await this.runTest('Get Contacts', async () => {
      const response = await api.getContacts({ limit: 10 });
      if (!Array.isArray(response.data) && !Array.isArray(response)) {
        throw new Error('Contacts response should be an array or contain data array');
      }
      return response;
    }, { requiresAuth: true });
  }

  // Test blog endpoints
  async testBlogEndpoints() {
    console.log('\n📝 Testing Blog Endpoints...');
    
    await this.runTest('Get Blogs', async () => {
      const response = await api.getBlogs({ limit: 10 });
      if (!Array.isArray(response.data) && !Array.isArray(response)) {
        throw new Error('Blogs response should be an array or contain data array');
      }
      return response;
    });

    await this.runTest('Create Blog Post', async () => {
      const blogData = {
        title: 'Test Blog Post',
        content: 'This is a test blog post for API testing',
        excerpt: 'Test excerpt',
        slug: `test-blog-${Date.now()}`,
        status: 'draft',
        tags: ['test', 'api']
      };
      
      const response = await api.createBlog(blogData);
      if (!response) throw new Error('No response from create blog');
      return response;
    }, { requiresAuth: true });
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting API Integration Tests...\n');
    
    this.results = {
      passed: [],
      failed: [],
      skipped: []
    };

    const startTime = Date.now();

    try {
      // Test in logical order
      await this.testSystemEndpoints();
      await this.testAuthEndpoints();
      await this.testProductEndpoints();
      await this.testOrderEndpoints();
      await this.testBranchEndpoints();
      await this.testCategoryEndpoints();
      await this.testUserEndpoints();
      await this.testTransactionEndpoints();
      await this.testReportEndpoints();
      await this.testContactEndpoints();
      await this.testBlogEndpoints();
      await this.testAuditEndpoints();
    } catch (error) {
      console.log('\n⚠️  Testing stopped due to critical error:', error.message);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    this.printSummary(totalTime);
    return this.results;
  }

  // Print test summary
  printSummary(totalTime) {
    console.log('\n' + '='.repeat(50));
    console.log('📋 API Test Summary');
    console.log('='.repeat(50));
    console.log(`Total Time: ${totalTime}ms`);
    console.log(`Passed: ${this.results.passed.length}`);
    console.log(`Failed: ${this.results.failed.length}`);
    console.log(`Skipped: ${this.results.skipped.length}`);
    
    if (this.results.failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.failed.forEach(test => {
        console.log(`  - ${test.name}: ${test.error} (${test.status})`);
      });
    }
    
    if (this.results.skipped.length > 0) {
      console.log('\n⏭️  Skipped Tests:');
      this.results.skipped.forEach(test => {
        console.log(`  - ${test.name}: ${test.reason}`);
      });
    }

    const successRate = Math.round((this.results.passed.length / 
      (this.results.passed.length + this.results.failed.length)) * 100);
    
    console.log(`\n🎯 Success Rate: ${successRate}%`);
    
    if (successRate >= 90) {
      console.log('🎉 Excellent! API integration is working well.');
    } else if (successRate >= 70) {
      console.log('⚠️  Good, but some endpoints need attention.');
    } else {
      console.log('🚨 Poor success rate. Major issues detected.');
    }
  }

  // Get detailed results
  getResults() {
    return this.results;
  }

  // Test specific endpoint
  async testEndpoint(endpointName, testFunction, options = {}) {
    return await this.runTest(endpointName, testFunction, options);
  }
}

// Create singleton instance
const apiTester = new APITester();

// Export utility functions
export const runAPITests = () => apiTester.runAllTests();
export const testEndpoint = (name, fn, options) => apiTester.testEndpoint(name, fn, options);
export const getTestResults = () => apiTester.getResults();

// Export class for custom testing
export default APITester;