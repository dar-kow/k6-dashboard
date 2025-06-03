
import React, { memo, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { fetchRepositories, importRepository, syncRepository, removeRepository } from '@/store/slices/repositorySlice';
import { executeTest } from '@/store/slices/testSlice';
import Card from '@/components/atoms/Card/Card';
import Button from '@/components/atoms/Button/Button';
import Terminal from '@/components/organisms/Terminal/Terminal';
import Select from 'react-select';
import './TestRunner.scss';

const TestRunner: React.FC = memo(() => {
  const dispatch = useDispatch();
  const { repositories, loading } = useSelector((state: RootState) => state.repository);
  const { isExecuting } = useSelector((state: RootState) => state.terminal);
  
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<string>('LIGHT');
  const [environment, setEnvironment] = useState<string>('PROD');
  const [customToken, setCustomToken] = useState<string>('');

  useEffect(() => {
    dispatch(fetchRepositories());
  }, [dispatch]);

  const testOptions = [
    { value: 'contractor_by_id_test', label: 'Contractor By Id Test' },
    { value: 'contractors_test', label: 'Contractors Test' },
    { value: 'invoice_by_id_test', label: 'Invoice By Id Test' },
    { value: 'invoice_items_test', label: 'Invoice Items Test' },
    { value: 'invoices_test', label: 'Invoices Test' },
  ];

  const profileOptions = [
    { value: 'LIGHT', label: 'LIGHT (5 VUs, 30s)' },
    { value: 'MEDIUM', label: 'MEDIUM (25 VUs, 60s)' },
    { value: 'HEAVY', label: 'HEAVY (50 VUs, 120s)' },
  ];

  const handleRunTest = () => {
    if (selectedTest && selectedProfile) {
      dispatch(executeTest({
        testName: selectedTest,
        profile: selectedProfile,
        environment,
        customToken: customToken || undefined,
      }));
    }
  };

  const handleRunAllTests = () => {
    dispatch(executeTest({
      testName: 'all',
      profile: selectedProfile,
      environment,
      customToken: customToken || undefined,
    }));
  };

  const handleAddRepository = () => {
    // Mock repository addition
    dispatch(importRepository({
      name: 'New Test Repository',
      url: 'https://github.com/example/k6-tests.git',
      branch: 'main',
    }));
  };

  return (
    <div className="test-runner">
      <div className="test-runner__header">
        <h1 className="test-runner__title">Test Runner</h1>
      </div>

      <Card className="test-runner__repository">
        <div className="test-runner__repo-header">
          <h2 className="test-runner__section-title">Git Repository</h2>
          <Button variant="primary" size="small" onClick={handleAddRepository}>
            Add Repository
          </Button>
        </div>
        
        <Select
          options={repositories.map(repo => ({ value: repo.id, label: repo.name }))}
          onChange={(option) => setSelectedRepo(option?.value || '')}
          placeholder="Maf K6 Test (main)"
          className="test-runner__select"
        />
        
        <div className="test-runner__repo-status">
          <div className="test-runner__repo-item">
            <span className="test-runner__repo-icon">📁</span>
            <span>Using https://github.com/dar-kow/k6-tests.git</span>
          </div>
          <div className="test-runner__repo-item">
            <span className="test-runner__repo-icon">🔗</span>
            <span>Branch: main, pull CONFIGS, RESULTS</span>
          </div>
          <div className="test-runner__repo-actions">
            <span className="test-runner__status test-runner__status--sync">Sync</span>
            <span className="test-runner__status test-runner__status--done">Done</span>
            <Button variant="secondary" size="small">
              Sync
            </Button>
            <Button variant="danger" size="small">
              Remove from Repository
            </Button>
          </div>
        </div>
      </Card>

      <Card className="test-runner__config">
        <h2 className="test-runner__section-title">Run Tests</h2>
        
        <div className="test-runner__environment">
          <span>Environment:</span>
          <div className="test-runner__env-buttons">
            <button
              className={`test-runner__env-btn ${environment === 'PROD' ? 'test-runner__env-btn--active test-runner__env-btn--prod' : ''}`}
              onClick={() => setEnvironment('PROD')}
            >
              PROD
            </button>
            <button
              className={`test-runner__env-btn ${environment === 'DEV' ? 'test-runner__env-btn--active test-runner__env-btn--dev' : ''}`}
              onClick={() => setEnvironment('DEV')}
            >
              DEV
            </button>
          </div>
          <div className="test-runner__token">
            <label>Custom Token:</label>
            <input
              type="text"
              value={customToken}
              onChange={(e) => setCustomToken(e.target.value)}
              placeholder="Enter authorization token"
              className="test-runner__token-input"
            />
          </div>
        </div>

        <div className="test-runner__connection-status">
          <span className="test-runner__connection-icon">✅</span>
          <span>WebSocket Connected</span>
          <span className="test-runner__target">Target: PROD - https://test.netural.com</span>
          <Button variant="secondary" size="small">
            Reset Connection
          </Button>
        </div>

        <div className="test-runner__test-selection">
          <div className="test-runner__form-row">
            <div className="test-runner__form-group">
              <label>Select Test:</label>
              <Select
                options={testOptions}
                onChange={(option) => setSelectedTest(option?.value || '')}
                placeholder="Contractor_by_id_test"
                className="test-runner__select"
              />
            </div>
            <div className="test-runner__form-group">
              <label>Select Profile:</label>
              <Select
                options={profileOptions}
                onChange={(option) => setSelectedProfile(option?.value || '')}
                value={profileOptions.find(option => option.value === selectedProfile)}
                className="test-runner__select"
              />
            </div>
          </div>
          
          <div className="test-runner__actions">
            <Button
              variant="primary"
              onClick={handleRunTest}
              disabled={!selectedTest || isExecuting}
              loading={isExecuting}
            >
              Run Selected Test
            </Button>
            <Button
              variant="success"
              onClick={handleRunAllTests}
              disabled={isExecuting}
            >
              Run All Tests Sequentially
            </Button>
            <Button variant="secondary">
              Clear Output
            </Button>
          </div>
        </div>
      </Card>

      <Card className="test-runner__terminal">
        <h2 className="test-runner__section-title">Test Execution Output</h2>
        <div className="test-runner__terminal-info">
          <span className="test-runner__terminal-icon">💡</span>
          <span>Toggle auto-scroll below to control terminal behavior</span>
        </div>
        <div className="test-runner__terminal-controls">
          <span className="test-runner__terminal-icon">🔄</span>
          <span>Terminal controls: Use auto-scroll toggle and manual scroll buttons below</span>
          <span className="test-runner__terminal-icon">🔄</span>
          <span>Auto-scroll is enabled - shows last output automatically</span>
          <span className="test-runner__terminal-icon">📁</span>
          <span>Repository: Maf K6 Test Test (branch: main)</span>
        </div>
        <Terminal />
        <div className="test-runner__terminal-footer">
          <span>Lines: 1</span>
          <Button variant="secondary" size="small">
            Auto Scroll: ON
          </Button>
          <Button variant="secondary" size="small">
            Last Line
          </Button>
        </div>
      </Card>
    </div>
  );
});

TestRunner.displayName = 'TestRunner';

export default TestRunner;
