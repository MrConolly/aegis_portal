import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, Play, Pause, RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface TestResult {
  id: string;
  name: string;
  status: 'passing' | 'failing' | 'pending' | 'running';
  lastRun: Date;
  duration: number;
  details?: string;
}

interface SystemHealth {
  database: boolean;
  websocket: boolean;
  api: boolean;
  uploads: boolean;
}

export default function TestingDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: false,
    websocket: false,
    api: false,
    uploads: false
  });

  // Real-time system health monitoring
  const { data: healthData } = useQuery({
    queryKey: ['/api/health'],
    queryFn: () => apiGet<SystemHealth>('/api/health'),
    refetchInterval: 5000, // Check every 5 seconds
  });

  useEffect(() => {
    if (healthData) {
      setSystemHealth(healthData);
    }
  }, [healthData]);

  // Initialize test suite
  const testSuite: TestResult[] = [
    {
      id: 'auth',
      name: 'Authentication System',
      status: 'pending',
      lastRun: new Date(),
      duration: 0,
      details: 'Login/logout functionality for all user roles'
    },
    {
      id: 'database',
      name: 'Database Operations',
      status: 'pending',
      lastRun: new Date(),
      duration: 0,
      details: 'CRUD operations and data integrity'
    },
    {
      id: 'websocket',
      name: 'Real-time Communication',
      status: 'pending',
      lastRun: new Date(),
      duration: 0,
      details: 'WebSocket messaging between portals'
    },
    {
      id: 'calendar',
      name: 'Calendar Automation',
      status: 'pending',
      lastRun: new Date(),
      duration: 0,
      details: 'Appointment scheduling and notifications'
    },
    {
      id: 'crm',
      name: 'CRM Lead Management',
      status: 'pending',
      lastRun: new Date(),
      duration: 0,
      details: 'Lead creation and conversion workflow'
    },
    {
      id: 'uploads',
      name: 'File Upload System',
      status: 'pending',
      lastRun: new Date(),
      duration: 0,
      details: 'Document and image upload functionality'
    },
    {
      id: 'reports',
      name: 'Report Generation',
      status: 'pending',
      lastRun: new Date(),
      duration: 0,
      details: 'PDF report creation and export'
    },
    {
      id: 'access',
      name: 'Role-based Access Control',
      status: 'pending',
      lastRun: new Date(),
      duration: 0,
      details: 'Portal access restrictions by user role'
    }
  ];

  useEffect(() => {
    setTestResults(testSuite);
  }, []);

  const runAllTests = async () => {
    setIsRunning(true);
    
    for (let i = 0; i < testResults.length; i++) {
      // Update test status to running
      setTestResults(prev => prev.map(test => 
        test.id === testResults[i].id 
          ? { ...test, status: 'running', lastRun: new Date() }
          : test
      ));

      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate test results (in real implementation, these would be actual test calls)
      const success = Math.random() > 0.2; // 80% success rate for demo
      const duration = Math.floor(Math.random() * 3000) + 500;
      
      setTestResults(prev => prev.map(test => 
        test.id === testResults[i].id 
          ? { 
              ...test, 
              status: success ? 'passing' : 'failing',
              duration,
              lastRun: new Date()
            }
          : test
      ));
    }
    
    setIsRunning(false);
  };

  const runSingleTest = async (testId: string) => {
    setTestResults(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status: 'running', lastRun: new Date() }
        : test
    ));

    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = Math.random() > 0.2;
    const duration = Math.floor(Math.random() * 3000) + 500;
    
    setTestResults(prev => prev.map(test => 
      test.id === testId 
        ? { 
            ...test, 
            status: success ? 'passing' : 'failing',
            duration,
            lastRun: new Date()
          }
        : test
    ));
  };

  const resetTests = () => {
    setTestResults(prev => prev.map(test => ({
      ...test,
      status: 'pending',
      duration: 0
    })));
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passing':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failing':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      passing: 'default',
      failing: 'destructive',
      running: 'secondary',
      pending: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status]} className="ml-2">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const passingTests = testResults.filter(t => t.status === 'passing').length;
  const failingTests = testResults.filter(t => t.status === 'failing').length;
  const totalTests = testResults.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AEGIS Testing Dashboard</h1>
          <p className="text-muted-foreground">Real-time feature and automation testing</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runAllTests} disabled={isRunning}>
            {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isRunning ? 'Running...' : 'Run All Tests'}
          </Button>
          <Button variant="outline" onClick={resetTests}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {systemHealth.database ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {systemHealth.database ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">WebSocket</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {systemHealth.websocket ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {systemHealth.websocket ? 'Active' : 'Inactive'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {systemHealth.api ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {systemHealth.api ? 'Responsive' : 'Error'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">File Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {systemHealth.uploads ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {systemHealth.uploads ? 'Working' : 'Failed'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{passingTests}</div>
              <div className="text-sm text-muted-foreground">Passing</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{failingTests}</div>
              <div className="text-sm text-muted-foreground">Failing</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{totalTests}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Test Results */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Tests</TabsTrigger>
          <TabsTrigger value="passing">Passing ({passingTests})</TabsTrigger>
          <TabsTrigger value="failing">Failing ({failingTests})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {testResults.map((test) => (
            <Card key={test.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <h3 className="font-medium">{test.name}</h3>
                      <p className="text-sm text-muted-foreground">{test.details}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {test.duration > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {test.duration}ms
                      </span>
                    )}
                    {getStatusBadge(test.status)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runSingleTest(test.id)}
                      disabled={test.status === 'running'}
                    >
                      Run Test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="passing" className="space-y-4">
          {testResults
            .filter(test => test.status === 'passing')
            .map((test) => (
              <Card key={test.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <h3 className="font-medium">{test.name}</h3>
                        <p className="text-sm text-muted-foreground">{test.details}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {test.duration}ms
                      </span>
                      {getStatusBadge(test.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="failing" className="space-y-4">
          {testResults
            .filter(test => test.status === 'failing')
            .map((test) => (
              <Card key={test.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <h3 className="font-medium">{test.name}</h3>
                        <p className="text-sm text-muted-foreground">{test.details}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {test.duration}ms
                      </span>
                      {getStatusBadge(test.status)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runSingleTest(test.id)}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}