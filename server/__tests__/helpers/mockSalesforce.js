/**
 * Salesforce API Mocking Utilities
 * Provides mocks for jsforce and Salesforce API calls
 */

const nock = require('nock');

/**
 * Mock successful Salesforce login
 */
const mockSalesforceLogin = (instanceUrl = 'https://test.salesforce.com') => {
  return nock('https://login.salesforce.com')
    .post('/services/Soap/u/58.0')
    .reply(200, `<?xml version="1.0" encoding="UTF-8"?>
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Body>
          <loginResponse>
            <result>
              <serverUrl>${instanceUrl}/services/Soap/u/58.0</serverUrl>
              <sessionId>test-session-id</sessionId>
              <userId>005VC00000HvZKEYA3</userId>
              <organizationId>00DVC000002mQof2AE</organizationId>
            </result>
          </loginResponse>
        </soapenv:Body>
      </soapenv:Envelope>`, {
      'Content-Type': 'text/xml; charset=UTF-8'
    });
};

/**
 * Mock Salesforce query response
 */
const mockSalesforceQuery = (sobject, records = []) => {
  return nock('https://test.salesforce.com')
    .get('/services/data/v58.0/query')
    .query(true)
    .reply(200, {
      totalSize: records.length,
      done: true,
      records: records
    });
};

/**
 * Mock Salesforce describe call
 */
const mockSalesforceDescribe = (sobjectName, fields = []) => {
  return nock('https://test.salesforce.com')
    .get(`/services/data/v58.0/sobjects/${sobjectName}/describe`)
    .reply(200, {
      name: sobjectName,
      fields: fields,
      label: sobjectName
    });
};

/**
 * Clean up all mocks
 */
const cleanupMocks = () => {
  nock.cleanAll();
};

module.exports = {
  mockSalesforceLogin,
  mockSalesforceQuery,
  mockSalesforceDescribe,
  cleanupMocks
};
