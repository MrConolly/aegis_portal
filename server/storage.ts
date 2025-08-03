import {
  users,
  patients,
  employees,
  familyMembers,
  patientEmployeeAssignments,
  crmLeads,
  appointments,
  chatMessages,
  employeeNotes,
  reviews,
  payrollRecords,
  documents,
  patientMedications,
  medicationAdministration,
  dailyCareTasks,
  scheduledTasks,
  taskCompletions,
  type User,
  type InsertUser,
  type Patient,
  type InsertPatient,
  type Employee,
  type InsertEmployee,
  type FamilyMember,
  type InsertFamilyMember,
  type CrmLead,
  type InsertCrmLead,
  type Appointment,
  type InsertAppointment,
  type ChatMessage,
  type InsertChatMessage,
  type EmployeeNote,
  type InsertEmployeeNote,
  type Review,
  type InsertReview,
  type PayrollRecord,
  type InsertPayrollRecord,
  type Document,
  type InsertDocument,
  type PatientMedication,
  type InsertPatientMedication,
  type MedicationAdministration,
  type InsertMedicationAdministration,
  type DailyCareTask,
  type InsertDailyCareTask,
  type ScheduledTask,
  type InsertScheduledTask,
  type TaskCompletion,
  type InsertTaskCompletion,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations with data integrity
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<boolean>; // Soft delete with cascade handling
  
  // Patient operations with comprehensive CRUD
  getPatients(): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, updates: Partial<InsertPatient>): Promise<Patient>;
  deletePatient(id: string): Promise<boolean>; // Soft delete, preserve history
  getPatientWithRelations(id: string): Promise<Patient & { familyMembers: FamilyMember[], assignments: any[] }>;
  
  // Employee operations with enhanced functionality
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<boolean>; // Soft delete with reassignment
  getEmployeeWithAssignments(id: string): Promise<Employee & { assignments: any[] }>;
  
  // Family member operations
  getFamilyMembers(): Promise<FamilyMember[]>;
  getFamilyMembersByPatient(patientId: string): Promise<FamilyMember[]>;
  createFamilyMember(familyMember: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMember(id: string, updates: Partial<InsertFamilyMember>): Promise<FamilyMember>;
  
  // CRM operations
  getCrmLeads(): Promise<CrmLead[]>;
  getCrmLead(id: string): Promise<CrmLead | undefined>;
  createCrmLead(lead: InsertCrmLead): Promise<CrmLead>;
  updateCrmLead(id: string, updates: Partial<InsertCrmLead>): Promise<CrmLead>;
  convertLeadToPatient(leadId: string, patientData: InsertPatient): Promise<Patient>;
  
  // Appointment operations
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment>;
  
  // Chat operations
  getChatMessages(userId1: string, userId2: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessage(id: string): Promise<void>;
  
  // Employee notes operations
  getEmployeeNotes(patientId: string): Promise<EmployeeNote[]>;
  createEmployeeNote(note: InsertEmployeeNote): Promise<EmployeeNote>;
  
  // Review operations
  getReviews(): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, updates: Partial<InsertReview>): Promise<Review>;
  
  // Payroll operations
  getPayrollRecords(employeeId?: string): Promise<PayrollRecord[]>;
  createPayrollRecord(record: InsertPayrollRecord): Promise<PayrollRecord>;
  
  // Document operations
  getDocuments(entityId: string, entityType: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  
  // Assignment operations
  assignEmployeeToPatient(patientId: string, employeeId: string): Promise<void>;
  removeEmployeeFromPatient(patientId: string, employeeId: string): Promise<void>;
  getEmployeePatients(employeeId: string): Promise<Patient[]>;
  getPatientEmployees(patientId: string): Promise<Employee[]>;
  createPatientEmployeeAssignment(assignment: { patientId: string; employeeId: string }): Promise<void>;
  
  // Role-based patient access
  getEmployeeAssignedPatients(employeeId: string): Promise<Patient[]>;
  getFamilyAccessiblePatients(userId: string): Promise<Patient[]>;
  getFamilyMembershipByUserId(userId: string): Promise<FamilyMember[]>;

  // Patient medication operations
  getPatientMedications(patientId: string): Promise<PatientMedication[]>;
  createPatientMedication(medication: InsertPatientMedication): Promise<PatientMedication>;
  updatePatientMedication(id: string, updates: Partial<InsertPatientMedication>): Promise<PatientMedication>;
  
  // Medication administration operations
  getMedicationAdministration(patientId: string, date?: string): Promise<MedicationAdministration[]>;
  createMedicationAdministration(administration: InsertMedicationAdministration): Promise<MedicationAdministration>;
  updateMedicationAdministration(id: string, updates: Partial<InsertMedicationAdministration>): Promise<MedicationAdministration>;
  getMissedMedications(): Promise<MedicationAdministration[]>;
  
  // Daily care task operations
  getDailyCareTask(patientId: string, date: string): Promise<DailyCareTask | undefined>;
  createDailyCareTask(task: InsertDailyCareTask): Promise<DailyCareTask>;
  updateDailyCareTask(id: string, updates: Partial<InsertDailyCareTask>): Promise<DailyCareTask>;
  
  // Scheduled task operations
  getScheduledTasks(patientId?: string): Promise<ScheduledTask[]>;
  createScheduledTask(task: InsertScheduledTask): Promise<ScheduledTask>;
  updateScheduledTask(id: string, updates: Partial<InsertScheduledTask>): Promise<ScheduledTask>;
  getOverdueTasks(): Promise<ScheduledTask[]>;
  
  // Task completion operations
  createTaskCompletion(completion: InsertTaskCompletion): Promise<TaskCompletion>;
  getTaskCompletions(taskId: string): Promise<TaskCompletion[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    // Soft delete: deactivate user and cascade to related records
    const [deletedUser] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return !!deletedUser;
  }



  // Patient operations
  async getPatients(): Promise<Patient[]> {
    return await db.select().from(patients).where(eq(patients.isActive, true)).orderBy(asc(patients.name));
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [newPatient] = await db.insert(patients).values(patient).returning();
    return newPatient;
  }

  async updatePatient(id: string, updates: Partial<InsertPatient>): Promise<Patient> {
    const [updatedPatient] = await db
      .update(patients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    if (!updatedPatient) {
      throw new Error('Patient not found');
    }
    return updatedPatient;
  }

  async deletePatient(id: string): Promise<boolean> {
    // Soft delete: deactivate patient and handle related records
    try {
      await db.transaction(async (tx) => {
        // Deactivate patient
        await tx
          .update(patients)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(patients.id, id));
        
        // Deactivate related assignments
        await tx
          .update(patientEmployeeAssignments)
          .set({ isActive: false })
          .where(eq(patientEmployeeAssignments.patientId, id));
        
        // Deactivate family member access
        await tx
          .update(familyMembers)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(familyMembers.patientId, id));
      });
      return true;
    } catch (error) {
      console.error('Error deleting patient:', error);
      return false;
    }
  }

  async getPatientWithRelations(id: string): Promise<Patient & { familyMembers: FamilyMember[], assignments: any[] }> {
    const patient = await this.getPatient(id);
    if (!patient) {
      throw new Error('Patient not found');
    }
    
    const familyMembers = await this.getFamilyMembersByPatient(id);
    const assignments = await db
      .select({
        employeeId: patientEmployeeAssignments.employeeId,
        employeeName: employees.name,
        assignedAt: patientEmployeeAssignments.assignedAt,
        isActive: patientEmployeeAssignments.isActive
      })
      .from(patientEmployeeAssignments)
      .leftJoin(employees, eq(patientEmployeeAssignments.employeeId, employees.id))
      .where(eq(patientEmployeeAssignments.patientId, id));
    
    return { ...patient, familyMembers, assignments };
  }

  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.isActive, true)).orderBy(asc(employees.name));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    if (!updatedEmployee) {
      throw new Error('Employee not found');
    }
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    // Soft delete: deactivate employee and reassign patients
    try {
      await db.transaction(async (tx) => {
        // Deactivate employee
        await tx
          .update(employees)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(employees.id, id));
        
        // Deactivate patient assignments (admin can reassign later)
        await tx
          .update(patientEmployeeAssignments)
          .set({ isActive: false })
          .where(eq(patientEmployeeAssignments.employeeId, id));
      });
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      return false;
    }
  }

  async getEmployeeWithAssignments(id: string): Promise<Employee & { assignments: any[] }> {
    const employee = await this.getEmployee(id);
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    const assignments = await db
      .select({
        patientId: patientEmployeeAssignments.patientId,
        patientName: patients.name,
        assignedAt: patientEmployeeAssignments.assignedAt,
        isActive: patientEmployeeAssignments.isActive
      })
      .from(patientEmployeeAssignments)
      .leftJoin(patients, eq(patientEmployeeAssignments.patientId, patients.id))
      .where(eq(patientEmployeeAssignments.employeeId, id));
    
    return { ...employee, assignments };
  }

  // Family member operations
  async getFamilyMembers(): Promise<FamilyMember[]> {
    return await db.select().from(familyMembers).where(eq(familyMembers.isActive, true));
  }



  async createFamilyMember(familyMember: InsertFamilyMember): Promise<FamilyMember> {
    const [newFamilyMember] = await db.insert(familyMembers).values(familyMember).returning();
    return newFamilyMember;
  }



  // CRM operations
  async getCrmLeads(): Promise<CrmLead[]> {
    return await db.select().from(crmLeads).orderBy(desc(crmLeads.updatedAt));
  }

  async getCrmLead(id: string): Promise<CrmLead | undefined> {
    const [lead] = await db.select().from(crmLeads).where(eq(crmLeads.id, id));
    return lead || undefined;
  }

  async createCrmLead(lead: InsertCrmLead): Promise<CrmLead> {
    const [newLead] = await db.insert(crmLeads).values(lead).returning();
    return newLead;
  }

  async updateCrmLead(id: string, updates: Partial<InsertCrmLead>): Promise<CrmLead> {
    const [updatedLead] = await db
      .update(crmLeads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(crmLeads.id, id))
      .returning();
    return updatedLead;
  }

  async convertLeadToPatient(leadId: string, patientData: InsertPatient): Promise<Patient> {
    const patient = await this.createPatient(patientData);
    // Archive or delete the lead after conversion
    await db.delete(crmLeads).where(eq(crmLeads.id, leadId));
    return patient;
  }

  // Appointment operations
  async getAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments).orderBy(asc(appointments.appointmentDate));
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(sql`DATE(${appointments.appointmentDate}) = ${date}`)
      .orderBy(asc(appointments.appointmentDate));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  // Chat operations
  async getChatMessages(userId1: string, userId2: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.isDeleted, false),
          sql`(${chatMessages.senderId} = ${userId1} AND ${chatMessages.receiverId} = ${userId2}) OR (${chatMessages.senderId} = ${userId2} AND ${chatMessages.receiverId} = ${userId1})`
        )
      )
      .orderBy(asc(chatMessages.createdAt));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  async deleteChatMessage(id: string): Promise<void> {
    await db
      .update(chatMessages)
      .set({ isDeleted: true })
      .where(eq(chatMessages.id, id));
  }

  // Employee notes operations
  async getEmployeeNotes(patientId: string): Promise<EmployeeNote[]> {
    return await db
      .select()
      .from(employeeNotes)
      .where(eq(employeeNotes.patientId, patientId))
      .orderBy(desc(employeeNotes.createdAt));
  }

  async createEmployeeNote(note: InsertEmployeeNote): Promise<EmployeeNote> {
    const [newNote] = await db.insert(employeeNotes).values(note).returning();
    return newNote;
  }

  // Review operations
  async getReviews(): Promise<Review[]> {
    return await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async updateReview(id: string, updates: Partial<InsertReview>): Promise<Review> {
    const [updatedReview] = await db
      .update(reviews)
      .set(updates)
      .where(eq(reviews.id, id))
      .returning();
    return updatedReview;
  }

  // Payroll operations
  async getPayrollRecords(employeeId?: string): Promise<PayrollRecord[]> {
    if (employeeId) {
      return await db
        .select()
        .from(payrollRecords)
        .where(eq(payrollRecords.employeeId, employeeId))
        .orderBy(desc(payrollRecords.year), desc(payrollRecords.month));
    }
    return await db
      .select()
      .from(payrollRecords)
      .orderBy(desc(payrollRecords.year), desc(payrollRecords.month));
  }

  async createPayrollRecord(record: InsertPayrollRecord): Promise<PayrollRecord> {
    const [newRecord] = await db.insert(payrollRecords).values(record).returning();
    return newRecord;
  }

  // Document operations
  async getDocuments(entityId: string, entityType: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(and(eq(documents.entityId, entityId), eq(documents.entityType, entityType)))
      .orderBy(desc(documents.createdAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  // Assignment operations
  async assignEmployeeToPatient(patientId: string, employeeId: string): Promise<void> {
    await db.insert(patientEmployeeAssignments).values({
      patientId,
      employeeId,
      isActive: true,
    });
  }

  async removeEmployeeFromPatient(patientId: string, employeeId: string): Promise<void> {
    await db
      .update(patientEmployeeAssignments)
      .set({ isActive: false })
      .where(
        and(
          eq(patientEmployeeAssignments.patientId, patientId),
          eq(patientEmployeeAssignments.employeeId, employeeId)
        )
      );
  }

  async getEmployeePatients(employeeId: string): Promise<Patient[]> {
    const result = await db
      .select()
      .from(patients)
      .innerJoin(
        patientEmployeeAssignments,
        and(
          eq(patientEmployeeAssignments.patientId, patients.id),
          eq(patientEmployeeAssignments.employeeId, employeeId),
          eq(patientEmployeeAssignments.isActive, true)
        )
      )
      .where(eq(patients.isActive, true));
    
    return result.map(row => row.patients);
  }

  async getPatientEmployees(patientId: string): Promise<Employee[]> {
    const result = await db
      .select()
      .from(employees)
      .innerJoin(
        patientEmployeeAssignments,
        and(
          eq(patientEmployeeAssignments.employeeId, employees.id),
          eq(patientEmployeeAssignments.patientId, patientId),
          eq(patientEmployeeAssignments.isActive, true)
        )
      )
      .where(eq(employees.isActive, true));
    
    return result.map(row => row.employees);
  }

  // Role-based patient access methods
  async getEmployeeAssignedPatients(employeeId: string): Promise<Patient[]> {
    // This returns the same as getEmployeePatients - patients assigned to a specific employee
    return this.getEmployeePatients(employeeId);
  }

  async getFamilyAccessiblePatients(userId: string): Promise<Patient[]> {
    // Get patients accessible to a family member based on their family membership
    const result = await db
      .select()
      .from(patients)
      .innerJoin(
        familyMembers,
        and(
          eq(familyMembers.patientId, patients.id),
          eq(familyMembers.userId, userId),
          eq(familyMembers.isActive, true)
        )
      )
      .where(eq(patients.isActive, true));
    
    return result.map(row => row.patients);
  }

  async getFamilyMembersByPatient(patientId: string): Promise<FamilyMember[]> {
    return await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.patientId, patientId))
      .orderBy(familyMembers.name);
  }

  async updateFamilyMember(id: string, updates: Partial<FamilyMember>): Promise<FamilyMember> {
    const [updated] = await db
      .update(familyMembers)
      .set(updates)
      .where(eq(familyMembers.id, id))
      .returning();
    return updated;
  }

  async getFamilyMembershipByUserId(userId: string): Promise<FamilyMember[]> {
    return await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.userId, userId));
  }

  // Patient medication operations
  async getPatientMedications(patientId: string): Promise<PatientMedication[]> {
    return await db.select().from(patientMedications)
      .where(and(eq(patientMedications.patientId, patientId), eq(patientMedications.isActive, true)));
  }

  async createPatientMedication(medication: InsertPatientMedication): Promise<PatientMedication> {
    const [newMedication] = await db.insert(patientMedications).values(medication).returning();
    return newMedication;
  }

  async updatePatientMedication(id: string, updates: Partial<InsertPatientMedication>): Promise<PatientMedication> {
    const [updatedMedication] = await db.update(patientMedications)
      .set(updates)
      .where(eq(patientMedications.id, id))
      .returning();
    return updatedMedication;
  }

  // Medication administration operations
  async getMedicationAdministration(patientId: string, date?: string): Promise<MedicationAdministration[]> {
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return await db.select().from(medicationAdministration)
        .where(and(
          eq(medicationAdministration.patientId, patientId),
          sql`${medicationAdministration.scheduledTime} >= ${startOfDay}`,
          sql`${medicationAdministration.scheduledTime} <= ${endOfDay}`
        ))
        .orderBy(desc(medicationAdministration.scheduledTime));
    }
    
    return await db.select().from(medicationAdministration)
      .where(eq(medicationAdministration.patientId, patientId))
      .orderBy(desc(medicationAdministration.scheduledTime));
  }

  async createMedicationAdministration(administration: InsertMedicationAdministration): Promise<MedicationAdministration> {
    const [newAdministration] = await db.insert(medicationAdministration).values(administration).returning();
    return newAdministration;
  }

  async updateMedicationAdministration(id: string, updates: Partial<InsertMedicationAdministration>): Promise<MedicationAdministration> {
    const [updatedAdministration] = await db.update(medicationAdministration)
      .set(updates)
      .where(eq(medicationAdministration.id, id))
      .returning();
    return updatedAdministration;
  }

  async getMissedMedications(): Promise<MedicationAdministration[]> {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    
    return await db.select().from(medicationAdministration)
      .where(and(
        eq(medicationAdministration.status, 'pending'),
        sql`${medicationAdministration.scheduledTime} <= ${thirtyMinutesAgo}`
      ))
      .orderBy(desc(medicationAdministration.scheduledTime));
  }

  // Daily care task operations
  async getDailyCareTask(patientId: string, date: string): Promise<DailyCareTask | undefined> {
    const [task] = await db.select().from(dailyCareTasks)
      .where(and(
        eq(dailyCareTasks.patientId, patientId),
        eq(dailyCareTasks.taskDate, date)
      ));
    return task || undefined;
  }

  async createDailyCareTask(task: InsertDailyCareTask): Promise<DailyCareTask> {
    const [newTask] = await db.insert(dailyCareTasks).values(task).returning();
    return newTask;
  }

  async updateDailyCareTask(id: string, updates: Partial<InsertDailyCareTask>): Promise<DailyCareTask> {
    const [updatedTask] = await db.update(dailyCareTasks)
      .set(updates)
      .where(eq(dailyCareTasks.id, id))
      .returning();
    return updatedTask;
  }

  // Scheduled task operations
  async getScheduledTasks(patientId?: string): Promise<ScheduledTask[]> {
    if (patientId) {
      return await db.select().from(scheduledTasks)
        .where(and(
          eq(scheduledTasks.patientId, patientId),
          eq(scheduledTasks.isActive, true)
        ))
        .orderBy(asc(scheduledTasks.nextDue));
    }
    
    return await db.select().from(scheduledTasks)
      .where(eq(scheduledTasks.isActive, true))
      .orderBy(asc(scheduledTasks.nextDue));
  }

  async createScheduledTask(task: InsertScheduledTask): Promise<ScheduledTask> {
    const [newTask] = await db.insert(scheduledTasks).values(task).returning();
    return newTask;
  }

  async updateScheduledTask(id: string, updates: Partial<InsertScheduledTask>): Promise<ScheduledTask> {
    const [updatedTask] = await db.update(scheduledTasks)
      .set(updates)
      .where(eq(scheduledTasks.id, id))
      .returning();
    return updatedTask;
  }

  async getOverdueTasks(): Promise<ScheduledTask[]> {
    const now = new Date();
    
    return await db.select().from(scheduledTasks)
      .where(and(
        eq(scheduledTasks.isActive, true),
        sql`${scheduledTasks.nextDue} <= ${now}`
      ))
      .orderBy(asc(scheduledTasks.nextDue));
  }

  // Task completion operations
  async createTaskCompletion(completion: InsertTaskCompletion): Promise<TaskCompletion> {
    const [newCompletion] = await db.insert(taskCompletions).values(completion).returning();
    return newCompletion;
  }

  async getTaskCompletions(taskId: string): Promise<TaskCompletion[]> {
    return await db.select().from(taskCompletions)
      .where(eq(taskCompletions.taskId, taskId))
      .orderBy(desc(taskCompletions.completedAt));
  }

  // Patient-Employee Assignment operations
  async createPatientEmployeeAssignment(assignment: { patientId: string; employeeId: string }): Promise<void> {
    await db.insert(patientEmployeeAssignments).values({
      patientId: assignment.patientId,
      employeeId: assignment.employeeId,
      assignedAt: new Date()
    });
  }
}

const storage = new DatabaseStorage();
export default storage;
