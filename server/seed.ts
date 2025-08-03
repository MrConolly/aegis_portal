import bcrypt from 'bcrypt';
import { db } from './db';
import { users, patients, employees, familyMembers, patientEmployeeAssignments, payrollRecords } from '@shared/schema';

async function seedData() {
  try {
    console.log('Starting to seed data...');
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const empPassword = await bcrypt.hash('employee123', 10);
    const familyPassword = await bcrypt.hash('family123', 10);
    
    // Create users
    await db.insert(users).values([
      { id: 'admin-001', username: 'aegis', password: adminPassword, role: 'admin' },
      { id: 'emp-001', username: 'sarah.johnson', password: empPassword, role: 'employee' },
      { id: 'family-001', username: 'mary.smith', password: familyPassword, role: 'family' }
    ]).onConflictDoNothing();
    
    // Create patients
    await db.insert(patients).values([
      { 
        id: 'patient-001', 
        name: 'Robert Smith', 
        dateOfBirth: '1946-03-15',
        doctor: 'Dr. Michael Thompson', 
        medications: 'Metformin 500mg twice daily, Lisinopril 10mg once daily',
        specializedTasks: 'Blood glucose monitoring twice daily, gentle walking exercises',
        paymentMethod: 'cinico',
        serviceCharge: '150.00',
        cinicoExpiration: '2025-06-30',
        adminNotes: 'Patient has diabetes. Family member Mary Smith is primary contact. Prefers morning appointments.'
      },
      { 
        id: 'patient-002', 
        name: 'Eleanor Davis', 
        dateOfBirth: '1942-07-22',
        doctor: 'Dr. Jennifer Park',
        medications: 'Warfarin 5mg daily, Furosemide 40mg twice daily',
        specializedTasks: 'INR monitoring weekly, compression stockings application',
        paymentMethod: 'cash',
        serviceCharge: '120.00',
        adminNotes: 'On blood thinners - careful with mobility. Lives alone but family checks daily.'
      },
      { 
        id: 'patient-003', 
        name: 'William Johnson', 
        dateOfBirth: '1953-11-08',
        doctor: 'Dr. Sarah Wilson',
        medications: 'Atorvastatin 20mg daily, Metoprolol 50mg twice daily',
        specializedTasks: 'Blood pressure monitoring daily, cardiac rehabilitation exercises',
        paymentMethod: '50/50',
        serviceCharge: '135.00',
        adminNotes: 'Recent heart surgery recovery. Progressing well but needs gentle encouragement.'
      }
    ]).onConflictDoNothing();
    
    // Create employees
    await db.insert(employees).values([
      {
        id: 'emp-001',
        userId: 'emp-001',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@aegiscare.ky',
        phone: '+1-345-123-4567',
        dateOfBirth: '1985-03-15',
        position: 'Registered Nurse',
        workPermitExpiry: '2025-12-31',
        employmentType: 'salary',
        salary: '65000.00',
        healthInsuranceAmount: '500.00'
      },
      {
        id: 'emp-002',
        userId: null,
        name: 'Michael Chen',
        email: 'michael.chen@aegiscare.ky',
        phone: '+1-345-234-5678',
        dateOfBirth: '1990-07-22',
        position: 'Care Assistant',
        workPermitExpiry: '2025-08-15',
        employmentType: 'hourly',
        salary: '25.00',
        healthInsuranceAmount: '400.00'
      }
    ]).onConflictDoNothing();
    
    // Create family members
    await db.insert(familyMembers).values([
      {
        id: 'family-001',
        userId: 'family-001',
        patientId: 'patient-001',
        name: 'Mary Smith',
        email: 'mary.smith@gmail.com',
        phone: '+1-345-987-6543'
      },
      {
        id: 'family-002',
        userId: null,
        patientId: 'patient-002',
        name: 'James Davis',
        email: 'james.davis@email.com',
        phone: '+1-345-876-5432'
      }
    ]).onConflictDoNothing();

    // Create patient-employee assignments
    await db.insert(patientEmployeeAssignments).values([
      {
        id: 'assignment-001',
        patientId: 'patient-001',
        employeeId: 'emp-001'
      },
      {
        id: 'assignment-002',
        patientId: 'patient-002',
        employeeId: 'emp-001'
      },
      {
        id: 'assignment-003',
        patientId: 'patient-003',
        employeeId: 'emp-002'
      }
    ]).onConflictDoNothing();

    // Create sample payroll records
    await db.insert(payrollRecords).values([
      {
        id: 'payroll-001',
        employeeId: 'emp-001',
        month: 'January',
        year: 2025,
        salaryAmount: '5416.67',
        hoursWorked: 0,
        healthInsuranceEmployee: '150.00',
        healthInsuranceEmployer: '350.00',
        pensionEmployee: '325.00',
        pensionEmployer: '650.00',
        loans: '0.00',
        deductions: '0.00',
        totalAmount: '4941.67'
      },
      {
        id: 'payroll-002',
        employeeId: 'emp-002',
        month: 'January',
        year: 2025,
        salaryAmount: '4000.00',
        hoursWorked: 160,
        healthInsuranceEmployee: '120.00',
        healthInsuranceEmployer: '280.00',
        pensionEmployee: '240.00',
        pensionEmployer: '480.00',
        loans: '200.00',
        deductions: '50.00',
        totalAmount: '3390.00'
      }
    ]).onConflictDoNothing();
    
    // Create patient-employee assignments
    await db.insert(patientEmployeeAssignments).values([
      { id: 'assign-001', patientId: 'patient-001', employeeId: 'emp-001' },
      { id: 'assign-002', patientId: 'patient-002', employeeId: 'emp-001' }
    ]).onConflictDoNothing();
    
    console.log('✓ Seed data created successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}

export { seedData };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData().then(() => process.exit(0)).catch(() => process.exit(1));
}