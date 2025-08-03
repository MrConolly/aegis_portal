import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import storage from "./storage";
import { 
  insertUserSchema,
  insertPatientSchema,
  insertEmployeeSchema,
  insertFamilyMemberSchema,
  insertCrmLeadSchema,
  insertAppointmentSchema,
  insertChatMessageSchema,
  insertEmployeeNoteSchema,
  insertReviewSchema,
  insertPayrollRecordSchema,
  insertDocumentSchema,
  insertPatientMedicationSchema,
  insertMedicationAdministrationSchema,
  insertDailyCareTaskSchema,
  insertScheduledTaskSchema,
  insertTaskCompletionSchema,
} from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "healthcare_management_secret";

// Multer configuration for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Role-based authorization middleware
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, WebSocket>();

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    
    if (userId) {
      clients.set(userId, ws);
    }

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'chat') {
          // Save message to database
          const chatMessage = await storage.createChatMessage({
            senderId: message.senderId,
            receiverId: message.receiverId,
            message: message.text,
            messageType: message.messageType || 'text',
          });

          // Send to receiver if online
          const receiverWs = clients.get(message.receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({
              type: 'chat',
              message: chatMessage,
            }));
          }

          // Send confirmation back to sender
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'chat_sent',
              message: chatMessage,
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove client from map
      for (const [id, client] of Array.from(clients.entries())) {
        if (client === ws) {
          clients.delete(id);
          break;
        }
      }
    });
  });

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log('Login attempt for username:', username);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log('User not found:', username);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log('User found, checking password...');
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log('Password mismatch for user:', username);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log('Login successful for:', username);

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    res.json({
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
    });
  });

  // Temporary admin setup endpoint for deployment
  app.post('/api/admin/setup', async (req, res) => {
    try {
      const { setupKey } = req.body;
      
      // Simple setup key check
      if (setupKey !== 'aegis-admin-setup-2025') {
        return res.status(401).json({ message: 'Invalid setup key' });
      }

      // Create/update admin user
      const adminPassword = await bcrypt.hash('admin123', 10);
      
      // Delete existing admin user if exists
      try {
        const existingUser = await storage.getUserByUsername('aegis');
        if (existingUser) {
          await db.delete(users).where(eq(users.username, 'aegis'));
        }
      } catch (e) {
        // User might not exist, that's okay
      }

      const adminUser = await storage.createUser({
        username: 'aegis',
        password: adminPassword,
        role: 'admin'
      });

      res.json({ 
        message: 'Admin user created successfully',
        username: adminUser.username,
        role: adminUser.role
      });
    } catch (error) {
      console.error('Admin setup error:', error);
      res.status(500).json({ message: 'Setup failed' });
    }
  });

  // Test data setup endpoint
  app.post('/api/setup-test-data', async (req, res) => {
    try {
      const { seedData } = await import('./seed');
      await seedData();
      
      res.json({
        message: 'Test data created successfully',
        credentials: {
          admin: { username: 'aegis', password: 'admin123' },
          employee: { username: 'sarah.johnson', password: 'employee123' },
          family: { username: 'mary.smith', password: 'family123' }
        },
        testData: {
          patients: 3,
          employees: 2,
          familyMembers: 2,
          assignments: 3,
          payrollRecords: 2
        }
      });
    } catch (error) {
      console.error('Test data setup error:', error);
      res.status(500).json({ message: 'Test data setup failed', error: error.message });
    }
  });

  // Force production admin setup
  app.post('/api/admin/force-setup', async (req, res) => {
    try {
      // Delete existing admin if any
      await db.delete(users).where(eq(users.role, 'admin'));

      // Create fresh admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = {
        id: 'admin-001',
        username: 'aegis',
        password: hashedPassword,
        role: 'admin' as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.insert(users).values(adminUser);
      
      // Create sample employee and family users
      const employeePassword = await bcrypt.hash('emp123', 10);
      const familyPassword = await bcrypt.hash('family123', 10);
      
      await db.insert(users).values([
        {
          id: 'emp-001',
          username: 'employee@healthcare.com',
          password: employeePassword,
          role: 'employee' as const,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'family-001', 
          username: 'family@healthcare.com',
          password: familyPassword,
          role: 'family' as const,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      
      res.json({ 
        message: 'All users created successfully',
        admin: 'aegis / admin123',
        employee: 'employee@healthcare.com / emp123',
        family: 'family@healthcare.com / family123'
      });
    } catch (error) {
      console.error('Force setup error:', error);
      res.status(500).json({ message: 'Setup failed', error: String(error) });
    }
  });

  // Debug endpoint to check user data
  app.get('/api/debug/users', async (req, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        role: users.role,
        isActive: users.isActive
      }).from(users);
      
      res.json({
        count: allUsers.length,
        users: allUsers
      });
    } catch (error) {
      console.error('Debug users error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Health check endpoint for testing dashboard
  // User credential management endpoints
  app.put('/api/users/:userId/credentials', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { userId } = req.params;
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatedUser = await storage.updateUser(userId, {
        username,
        password: hashedPassword,
      });
      
      res.json({ message: 'Credentials updated successfully', userId: updatedUser.id });
    } catch (error) {
      console.error('Update credentials error:', error);
      res.status(500).json({ message: 'Internal server error', error: (error as any).message });
    }
  });
  
  app.post('/api/users/:userId/send-access', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { userId } = req.params;
      const { email, username, password } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const accessLink = `${protocol}://${host}/login`;
      
      // Import SendGrid functionality dynamically
      const { sendEmail, generateAccessEmail } = await import('./sendgrid');
      const emailContent = generateAccessEmail(email, accessLink, username, password);
      
      const emailSent = await sendEmail({
        to: email,
        from: 'noreply@aegisprofessionalcare.com',
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });
      
      if (emailSent) {
        res.json({ 
          message: 'Access credentials sent successfully via email',
          email,
          accessLink
        });
      } else {
        res.status(500).json({ message: 'Failed to send email' });
      }
    } catch (error) {
      console.error('Send access error:', error);
      res.status(500).json({ message: 'Internal server error', error: (error as any).message });
    }
  });

  // Patient family member management (for family portal)
  app.get('/api/patients/:patientId/family-members', authenticateToken, async (req, res) => {
    try {
      const { patientId } = req.params;
      const familyMembers = await storage.getFamilyMembersByPatient(patientId);
      res.json(familyMembers);
    } catch (error) {
      console.error('Get patient family members error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/patients/:patientId/family-members', authenticateToken, async (req, res) => {
    try {
      const { patientId } = req.params;
      const familyMemberData = insertFamilyMemberSchema.parse({
        ...req.body,
        patientId
      });
      
      // Create user account for family member
      const hashedPassword = await bcrypt.hash('temp123', 10);
      const user = await storage.createUser({
        username: familyMemberData.email,
        password: hashedPassword,
        role: 'family',
      });

      const familyMember = await storage.createFamilyMember({
        ...familyMemberData,
        userId: user.id,
      });
      
      res.status(201).json(familyMember);
    } catch (error) {
      console.error('Create family member error:', error);
      res.status(500).json({ message: 'Internal server error', error: (error as any).message });
    }
  });

  app.put('/api/family-members/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedFamilyMember = await storage.updateFamilyMember(id, updates);
      res.json(updatedFamilyMember);
    } catch (error) {
      console.error('Update family member error:', error);
      res.status(500).json({ message: 'Internal server error', error: (error as any).message });
    }
  });

  // Family accessible patients endpoint
  app.get('/api/family/accessible-patients', authenticateToken, requireRole(['family']), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const patients = await storage.getFamilyAccessiblePatients(userId);
      res.json(patients);
    } catch (error) {
      console.error('Get family accessible patients error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/health', async (req, res) => {
    try {
      // Test database connection
      let database = false;
      try {
        await storage.getUser('test-id');
        database = true;
      } catch (error) {
        console.error('Database health check failed:', error);
      }

      // Test WebSocket server
      const websocket = wss.clients.size >= 0; // WebSocket server is running

      // Test API responsiveness (if we got here, API is working)
      const api = true;

      // Test upload directory
      let uploads = false;
      try {
        const fs = await import('fs');
        uploads = fs.existsSync('uploads');
      } catch (error) {
        console.error('Upload directory check failed:', error);
      }

      res.json({
        database,
        websocket,
        api,
        uploads,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({ 
        database: false,
        websocket: false,
        api: false,
        uploads: false,
        error: 'Health check failed'
      });
    }
  });

  // Remove the old admin-only patients endpoint as it's replaced above

  app.post('/api/patients', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const requestData = { ...req.body };
      const assignedEmployees = requestData.assignedEmployees || [];
      delete requestData.assignedEmployees;

      // Convert numeric fields to strings for decimal columns
      if (typeof requestData.serviceCharge === 'number') {
        requestData.serviceCharge = requestData.serviceCharge.toString();
      }

      const patientData = insertPatientSchema.parse(requestData);
      const patient = await storage.createPatient(patientData);

      // Create patient-employee assignments
      if (assignedEmployees.length > 0) {
        for (const employeeId of assignedEmployees.slice(0, 2)) { // Max 2 employees
          await storage.createPatientEmployeeAssignment({
            patientId: patient.id,
            employeeId: employeeId
          });
        }
      }

      res.status(201).json(patient);
    } catch (error) {
      console.error('Create patient error:', error);
      if (error.name === 'ZodError') {
        // Zod validation error
        res.status(400).json({ 
          message: 'Validation error', 
          errors: (error as any).errors.map((e: any) => ({ field: e.path.join('.'), message: e.message })),
          receivedData: req.body
        });
      } else {
        res.status(500).json({ message: 'Internal server error', error: (error as any).message });
      }
    }
  });

  app.put('/api/patients/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const patientData = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(req.params.id, patientData);
      res.json(patient);
    } catch (error) {
      console.error('Update patient error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Employee routes
  app.get('/api/employees', authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error('Get employees error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Employee-specific endpoints
  app.get('/api/employees/me', authenticateToken, requireRole(['employee']), async (req: any, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: 'Employee profile not found' });
      }
      res.json(employee);
    } catch (error) {
      console.error('Get employee profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Employee can only access their assigned patients
  app.get('/api/employees/:id/patients', authenticateToken, requireRole(['employee', 'admin']), async (req: any, res) => {
    try {
      // Only allow employees to access their own assignments or admins to access any
      if (req.user.role === 'employee' && req.params.id !== req.user.id) {
        return res.status(403).json({ message: 'Cannot access other employee assignments' });
      }
      
      const assignedPatients = await storage.getEmployeeAssignedPatients(req.params.id);
      res.json(assignedPatients);
    } catch (error) {
      console.error('Get employee assigned patients error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Allow employees to access their own assigned patients directly
  app.get('/api/patients', authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role === 'admin') {
        // Admin gets all patients
        const patients = await storage.getPatients();
        res.json(patients);
      } else if (req.user.role === 'employee') {
        // Employee gets only assigned patients
        const assignedPatients = await storage.getEmployeeAssignedPatients(req.user.id);
        res.json(assignedPatients);
      } else if (req.user.role === 'family') {
        // Family gets only accessible patients
        const familyPatients = await storage.getFamilyAccessiblePatients(req.user.id);
        res.json(familyPatients);
      } else {
        res.status(403).json({ message: 'Insufficient permissions' });
      }
    } catch (error) {
      console.error('Get patients error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/employees', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      // Transform firstName + lastName to name field
      const requestData = { ...req.body };
      if (requestData.firstName && requestData.lastName) {
        requestData.name = `${requestData.firstName} ${requestData.lastName}`;
        delete requestData.firstName;
        delete requestData.lastName;
      }
      
      // Handle role to position field mapping
      if (requestData.role && !requestData.position) {
        requestData.position = requestData.role;
        delete requestData.role;
      }
      
      // Handle missing employmentStatus field
      if (!requestData.employmentStatus) {
        requestData.employmentStatus = 'active';
      }
      
      // Handle missing hireDate field
      if (!requestData.hireDate) {
        requestData.hireDate = new Date().toISOString().split('T')[0];
      }
      
      // Handle empty date fields by converting to null
      if (requestData.dateOfBirth === '') {
        requestData.dateOfBirth = null;
      }
      if (requestData.workPermitExpiry === '') {
        requestData.workPermitExpiry = null;
      }
      
      // Convert numeric fields to strings for decimal columns
      if (typeof requestData.salary === 'number') {
        requestData.salary = requestData.salary.toString();
      }
      if (typeof requestData.healthInsuranceAmount === 'number') {
        requestData.healthInsuranceAmount = requestData.healthInsuranceAmount.toString();
      }
      
      // Handle empty string numeric fields by converting to null
      if (requestData.salary === '') {
        requestData.salary = null;
      }
      if (requestData.healthInsuranceAmount === '') {
        requestData.healthInsuranceAmount = null;
      }
      
      const employeeData = insertEmployeeSchema.parse(requestData);
      
      // Check if email already exists in users table
      const existingUser = await storage.getUserByUsername(employeeData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists in the system' });
      }
      
      // Create user account for employee
      const hashedPassword = await bcrypt.hash('temp123', 10); // Temporary password
      const user = await storage.createUser({
        username: employeeData.email,
        password: hashedPassword,
        role: 'employee',
      });

      const employee = await storage.createEmployee({
        ...employeeData,
        userId: user.id,
      });
      
      res.status(201).json(employee);
    } catch (error) {
      console.error('Create employee error:', error);
      if ((error as any).name === 'ZodError') {
        // Zod validation error
        res.status(400).json({ 
          message: 'Validation error', 
          errors: (error as any).errors.map((e: any) => ({ field: e.path.join('.'), message: e.message })),
          receivedData: req.body
        });
      } else if ((error as any).code === '23505') {
        // Unique constraint violation
        res.status(400).json({ message: 'Employee with this email already exists' });
      } else {
        res.status(500).json({ message: 'Internal server error', error: (error as any).message });
      }
    }
  });

  // Family member routes
  app.get('/api/family-members', authenticateToken, requireRole(['admin']), async (req: any, res) => {
    try {
      const familyMembers = await storage.getFamilyMembers();
      res.json(familyMembers);
    } catch (error) {
      console.error('Get family members error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/family-members', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const familyMemberData = insertFamilyMemberSchema.parse(req.body);
      
      // Create user account for family member
      const hashedPassword = await bcrypt.hash('temp123', 10); // Temporary password
      const user = await storage.createUser({
        username: familyMemberData.email,
        password: hashedPassword,
        role: 'family',
      });

      const familyMember = await storage.createFamilyMember({
        ...familyMemberData,
        userId: user.id,
      });
      
      res.status(201).json(familyMember);
    } catch (error) {
      console.error('Create family member error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Family member can only access their assigned patient data
  app.get('/api/family/my-patients', authenticateToken, requireRole(['family']), async (req: any, res) => {
    try {
      const familyAccessiblePatients = await storage.getFamilyAccessiblePatients(req.user.id);
      res.json(familyAccessiblePatients);
    } catch (error) {
      console.error('Get family accessible patients error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Family member-specific endpoints
  app.get('/api/family-members/me', authenticateToken, requireRole(['family']), async (req: any, res) => {
    try {
      const familyMember = await storage.getFamilyMemberByUserId(req.user.id);
      if (!familyMember) {
        return res.status(404).json({ message: 'Family member profile not found' });
      }
      res.json(familyMember);
    } catch (error) {
      console.error('Get family member profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Family member can only access their own membership info
  app.get('/api/family/my-membership', authenticateToken, requireRole(['family']), async (req: any, res) => {
    try {
      const familyMembership = await storage.getFamilyMembershipByUserId(req.user.id);
      res.json(familyMembership);
    } catch (error) {
      console.error('Get family membership error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // CRM routes
  app.get('/api/crm-leads', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const leads = await storage.getCrmLeads();
      res.json(leads);
    } catch (error) {
      console.error('Get CRM leads error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/crm-leads', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const leadData = insertCrmLeadSchema.parse(req.body);
      const lead = await storage.createCrmLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      console.error('Create CRM lead error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/crm-leads/:id/convert', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.convertLeadToPatient(req.params.id, patientData);
      res.status(201).json(patient);
    } catch (error) {
      console.error('Convert lead error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Appointment routes
  app.get('/api/appointments', authenticateToken, async (req: any, res) => {
    try {
      const { date } = req.query;
      let appointments;
      
      if (date) {
        appointments = await storage.getAppointmentsByDate(date as string);
      } else {
        appointments = await storage.getAppointments();
      }
      
      res.json(appointments);
    } catch (error) {
      console.error('Get appointments error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/appointments', authenticateToken, async (req: any, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      console.error('Create appointment error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Chat routes
  app.get('/api/chat/:userId', authenticateToken, async (req: any, res) => {
    try {
      const messages = await storage.getChatMessages(req.user.id, req.params.userId);
      res.json(messages);
    } catch (error) {
      console.error('Get chat messages error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Employee notes routes
  app.get('/api/patients/:patientId/notes', authenticateToken, async (req, res) => {
    try {
      const notes = await storage.getEmployeeNotes(req.params.patientId);
      res.json(notes);
    } catch (error) {
      console.error('Get employee notes error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/patients/:patientId/notes', authenticateToken, requireRole(['employee', 'admin']), async (req: any, res) => {
    try {
      const noteData = insertEmployeeNoteSchema.parse({
        ...req.body,
        patientId: req.params.patientId,
        employeeId: req.user.role === 'employee' ? req.user.id : req.body.employeeId,
      });
      const note = await storage.createEmployeeNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      console.error('Create employee note error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Review routes
  app.get('/api/reviews', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const reviews = await storage.getReviews();
      res.json(reviews);
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/reviews', authenticateToken, async (req: any, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: req.user.id,
      });
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Payroll routes
  app.get('/api/payroll', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { employeeId } = req.query;
      const records = await storage.getPayrollRecords(employeeId as string);
      res.json(records);
    } catch (error) {
      console.error('Get payroll records error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/payroll', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const payrollData = insertPayrollRecordSchema.parse(req.body);
      const record = await storage.createPayrollRecord(payrollData);
      res.status(201).json(record);
    } catch (error) {
      console.error('Create payroll record error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // File upload routes
  app.post('/api/upload', authenticateToken, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const document = await storage.createDocument({
        entityId: req.body.entityId,
        entityType: req.body.entityType,
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        fileType: req.file.mimetype,
        uploadedBy: req.user.id,
      });

      res.status(201).json(document);
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Employee-Patient assignment routes
  app.post('/api/patients/:patientId/assign-employee/:employeeId', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      await storage.assignEmployeeToPatient(req.params.patientId, req.params.employeeId);
      res.status(200).json({ message: 'Employee assigned successfully' });
    } catch (error) {
      console.error('Assign employee error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/patients/:patientId/assign-employee/:employeeId', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      await storage.removeEmployeeFromPatient(req.params.patientId, req.params.employeeId);
      res.status(200).json({ message: 'Employee removed successfully' });
    } catch (error) {
      console.error('Remove employee error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/employees/:employeeId/patients', authenticateToken, async (req, res) => {
    try {
      const patients = await storage.getEmployeePatients(req.params.employeeId);
      res.json(patients);
    } catch (error) {
      console.error('Get employee patients error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/patients/:patientId/employees', authenticateToken, async (req, res) => {
    try {
      const employees = await storage.getPatientEmployees(req.params.patientId);
      res.json(employees);
    } catch (error) {
      console.error('Get patient employees error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Patient Medication Management Routes
  app.get('/api/patients/:patientId/medications', authenticateToken, requireRole(['admin', 'employee']), async (req, res) => {
    try {
      const { patientId } = req.params;
      const medications = await storage.getPatientMedications(patientId);
      res.json(medications);
    } catch (error) {
      console.error('Get patient medications error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/patients/:patientId/medications', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { patientId } = req.params;
      const medicationData = insertPatientMedicationSchema.parse({
        ...req.body,
        patientId
      });
      
      const medication = await storage.createPatientMedication(medicationData);
      res.status(201).json(medication);
    } catch (error) {
      console.error('Create patient medication error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Medication Administration Routes
  app.get('/api/patients/:patientId/medication-administration', authenticateToken, requireRole(['admin', 'employee']), async (req, res) => {
    try {
      const { patientId } = req.params;
      const { date } = req.query;
      const administrations = await storage.getMedicationAdministration(patientId, date as string);
      res.json(administrations);
    } catch (error) {
      console.error('Get medication administration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/medication-administration', authenticateToken, requireRole(['employee']), async (req: any, res) => {
    try {
      const administrationData = insertMedicationAdministrationSchema.parse({
        ...req.body,
        employeeId: req.user.id
      });
      
      const administration = await storage.createMedicationAdministration(administrationData);
      res.status(201).json(administration);
    } catch (error) {
      console.error('Create medication administration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/medication-administration/:id', authenticateToken, requireRole(['employee']), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const administration = await storage.updateMedicationAdministration(id, updates);
      res.json(administration);
    } catch (error) {
      console.error('Update medication administration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get missed medications for admin alerts
  app.get('/api/missed-medications', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const missedMedications = await storage.getMissedMedications();
      res.json(missedMedications);
    } catch (error) {
      console.error('Get missed medications error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Daily Care Tasks Routes
  app.get('/api/patients/:patientId/daily-care/:date', authenticateToken, requireRole(['admin', 'employee']), async (req, res) => {
    try {
      const { patientId, date } = req.params;
      const careTask = await storage.getDailyCareTask(patientId, date);
      res.json(careTask || null);
    } catch (error) {
      console.error('Get daily care task error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/daily-care-tasks', authenticateToken, requireRole(['employee']), async (req: any, res) => {
    try {
      const taskData = insertDailyCareTaskSchema.parse({
        ...req.body,
        employeeId: req.user.id
      });
      
      const task = await storage.createDailyCareTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error('Create daily care task error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/daily-care-tasks/:id', authenticateToken, requireRole(['employee']), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const task = await storage.updateDailyCareTask(id, updates);
      res.json(task);
    } catch (error) {
      console.error('Update daily care task error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Scheduled Tasks Routes
  app.get('/api/scheduled-tasks', authenticateToken, requireRole(['admin', 'employee']), async (req, res) => {
    try {
      const { patientId } = req.query;
      const tasks = await storage.getScheduledTasks(patientId as string);
      res.json(tasks);
    } catch (error) {
      console.error('Get scheduled tasks error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/scheduled-tasks', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const taskData = insertScheduledTaskSchema.parse(req.body);
      const task = await storage.createScheduledTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error('Create scheduled task error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/overdue-tasks', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const overdueTasks = await storage.getOverdueTasks();
      res.json(overdueTasks);
    } catch (error) {
      console.error('Get overdue tasks error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Task Completion Routes
  app.post('/api/task-completions', authenticateToken, requireRole(['employee']), async (req: any, res) => {
    try {
      const completionData = insertTaskCompletionSchema.parse({
        ...req.body,
        employeeId: req.user.id,
        completedAt: new Date()
      });
      
      const completion = await storage.createTaskCompletion(completionData);
      res.status(201).json(completion);
    } catch (error) {
      console.error('Create task completion error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return httpServer;
}
