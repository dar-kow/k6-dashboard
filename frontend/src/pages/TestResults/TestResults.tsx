
import React, { memo, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { fetchTestDirectories, fetchTestResult, setSelectedTest } from '@/store/slices/testSlice';
import Card from '@/components/atoms/Card/Card';
import Button from '@/components/atoms/Button/Button';
import Select from 'react-select';
import './TestResults.scss';

const TestResults: React.FC = memo(() => {
  const dispatch = useDispatch();
  const { testDirectories, testResults, selectedTest, loading } = useSelector((state: RootState) => state.test);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    dispatch(fetchTestDirectories());
  }, [dispatch]);

  const handleTestSelect = (option: any) => {
    if (option) {
      dispatch(setSelectedTest(option.value));
      dispatch(fetchTestResult(option.value));
    }
  };

  const testOptions = testDirectories.map(dir => ({
    value: dir.path,
    label: `${dir.name} - ${dir.date}${dir.type === 'directory' ? ' (Sequential)' : ''}`,
    type: dir.type,
  }));

  const formatMetric = (metric: any) => {
    if (typeof metric === 'object' && metric !== null) {
      return `${metric.avg?.toFixed(2) || '0.00'} ms`;
    }
    return metric?.toString() || '0';
  };

  const mockSequentialTests = [
    'contractor_by_id_test',
    'contractors_test',
    'invoice_by_id_test',
    'invoice_items_test',
    'invoices_test',
  ];

  return (
    <div className="test-results">
      <div className="test-results__header">
        <h1 className="test-results__title">Test Results</h1>
        <Button variant="danger">
          Export Test PDF
        </Button>
      </div>

      <Card className="test-results__selector">
        <h2 className="test-results__section-title">Select Test Run for Analysis</h2>
        <Select
          options={testOptions}
          onChange={handleTestSelect}
          placeholder="Select a test run..."
          className="test-results__select"
          isLoading={loading}
        />
        
        {selectedTest && (
          <div className="test-results__current">
            <h3>Currently Analyzing</h3>
            <p>Sequential Run - 02.06.2025, 17:30:23 (Latest)</p>
            <div className="test-results__repo-info">
              <span className="test-results__repo-label">Repository: Maf K6 Test</span>
              <span className="test-results__test-id">Test: 195055334 bb26 44c9 8bbb 76b249ab8d41/sequential 20250602 173023</span>
            </div>
          </div>
        )}
      </Card>

      {testResults && (
        <>
          <Card className="test-results__sequential">
            <h2 className="test-results__section-title">Sequential Run</h2>
            <p className="test-results__description">Sequential test run - multiple tests executed one after another</p>
            
            <div className="test-results__tabs">
              {mockSequentialTests.map((test, index) => (
                <button
                  key={test}
                  className={`test-results__tab ${selectedTab === index ? 'test-results__tab--active' : ''}`}
                  onClick={() => setSelectedTab(index)}
                >
                  {test}
                </button>
              ))}
            </div>
          </Card>

          <Card className="test-results__details">
            <div className="test-results__repo-header">
              <h3>Repository: Maf K6 Test</h3>
              <span className="test-results__test-path">
                Test: 195055334 bb26 44c9 8bbb 76b249ab8d41/sequential 20250602 173023
              </span>
            </div>

            <div className="test-results__metrics">
              <div className="test-results__metric">
                <span className="test-results__metric-icon">📊</span>
                <div className="test-results__metric-content">
                  <div className="test-results__metric-label">Total Requests</div>
                  <div className="test-results__metric-value">{testResults.metrics.http_reqs?.count || 5761}</div>
                </div>
              </div>
              <div className="test-results__metric">
                <span className="test-results__metric-icon">⚡</span>
                <div className="test-results__metric-content">
                  <div className="test-results__metric-label">Request Rate</div>
                  <div className="test-results__metric-value">{testResults.metrics.http_reqs?.rate?.toFixed(2) || 191.85}/s</div>
                </div>
              </div>
              <div className="test-results__metric">
                <span className="test-results__metric-icon">⏱️</span>
                <div className="test-results__metric-content">
                  <div className="test-results__metric-label">Avg Response Time</div>
                  <div className="test-results__metric-value">{formatMetric(testResults.metrics.http_req_duration)}</div>
                </div>
              </div>
              <div className="test-results__metric">
                <span className="test-results__metric-icon">✅</span>
                <div className="test-results__metric-content">
                  <div className="test-results__metric-label">Error Rate</div>
                  <div className="test-results__metric-value">0.00%</div>
                </div>
              </div>
            </div>

            <div className="test-results__http-details">
              <h3>HTTP Request Details</h3>
              <div className="test-results__table-container">
                <table className="test-results__table">
                  <thead>
                    <tr>
                      <th>METRIC</th>
                      <th>MIN</th>
                      <th>AVG</th>
                      <th>MED</th>
                      <th>MAX</th>
                      <th>P(90)</th>
                      <th>P(95)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Total Duration</td>
                      <td>16.01 ms</td>
                      <td>25.57 ms</td>
                      <td>23.62 ms</td>
                      <td>208.81 ms</td>
                      <td>0.00 ms</td>
                      <td>0.00 ms</td>
                    </tr>
                    <tr>
                      <td>Waiting</td>
                      <td>15.92 ms</td>
                      <td>25.47 ms</td>
                      <td>23.53 ms</td>
                      <td>208.76 ms</td>
                      <td>0.00 ms</td>
                      <td>0.00 ms</td>
                    </tr>
                    <tr>
                      <td>Connecting</td>
                      <td>0.00 ms</td>
                      <td>0.00 ms</td>
                      <td>0.00 ms</td>
                      <td>46.72 ms</td>
                      <td>0.00 ms</td>
                      <td>0.00 ms</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="test-results__checks">
              <h3>Checks</h3>
              <div className="test-results__table-container">
                <table className="test-results__table">
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>PASSES</th>
                      <th>FAILS</th>
                      <th>PASS RATE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>contractor-by-id: status is 200 or 404</td>
                      <td>5761</td>
                      <td>0</td>
                      <td>100.00%</td>
                      <td><span className="test-results__status test-results__status--pass">PASS</span></td>
                    </tr>
                    <tr>
                      <td>contractor-by-id: response time &lt; 5000ms</td>
                      <td>5761</td>
                      <td>0</td>
                      <td>100.00%</td>
                      <td><span className="test-results__status test-results__status--pass">PASS</span></td>
                    </tr>
                    <tr>
                      <td>contractor-by-id: content-type is JSON</td>
                      <td>5761</td>
                      <td>0</td>
                      <td>100.00%</td>
                      <td><span className="test-results__status test-results__status--pass">PASS</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
});

TestResults.displayName = 'TestResults';

export default TestResults;
