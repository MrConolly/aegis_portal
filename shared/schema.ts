import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  timestamp, 
  boolean, 
  date,
  decimal,
  jsonb
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").notNull().unique(),
  password: varchar("password").notNull(),
  role: varchar("role").notNull(), // 'admin', 'employee', 'family'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Patients table
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  doctor: varchar("doctor"),
  medications: text("medications"),
  specializedTasks: text("specialized_tasks"),
  paymentMethod: varchar("payment_method"), // 'cash', 'cinico', '50/50'
  serviceCharge: decimal("service_charge", { precision: 10, scale: 2 }),
  cinicoExpiration: date("cinico_expiration"),
  photoUrl: varchar("photo_url"),
  adminNotes: text("admin_notes"), // Admin notes field
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employees table
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  dateOfBirth: date("date_of_birth"),
  position: varchar("position").notNull(),
  workPermitExpiry: date("work_permit_expiry"),
  employmentType: varchar("employment_type"), // 'hourly', 'salary'
  salary: decimal("salary", { precision: 10, scale: 2 }),
  healthInsuranceAmount: decimal("health_insurance_amount", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Family members table
export const familyMembers = pgTable("family_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  patientId: varchar("patient_id").references(() => patients.id),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Patient-Employee assignments
export const patientEmployeeAssignments = pgTable("patient_employee_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id),
  employeeId: varchar("employee_id").references(() => employees.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// CRM Leads
export const crmLeads = pgTable("crm_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  age: integer("age"),
  condition: varchar("condition"),
  stage: varchar("stage").notNull(), // 'initial_contact', 'in_progress', 'ready_to_convert'
  lastContact: text("last_contact"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Appointments
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id),
  employeeId: varchar("employee_id").references(() => employees.id),
  title: varchar("title").notNull(),
  description: text("description"),
  appointmentDate: timestamp("appointment_date").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id),
  receiverId: varchar("receiver_id").references(() => users.id),
  message: text("message").notNull(),
  messageType: varchar("message_type").default('text'), // 'text', 'image'
  isDeleted: boolean("is_deleted").default(false),
  canDelete: boolean("can_delete").default(true), // Can be deleted within 2 minutes
  createdAt: timestamp("created_at").defaultNow(),
});

// Employee notes
export const employeeNotes = pgTable("employee_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id),
  patientId: varchar("patient_id").references(() => patients.id),
  note: text("note").notNull(),
  noteType: varchar("note_type").default('general'), // 'general', 'vital', 'medication'
  createdAt: timestamp("created_at").defaultNow(),
});

// Patient Medications
export const patientMedications = pgTable("patient_medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id),
  medicationName: varchar("medication_name").notNull(),
  dosage: varchar("dosage").notNull(),
  frequency: varchar("frequency").notNull(), // 'morning', 'afternoon', 'evening', 'custom'
  customTimes: text("custom_times").array(), // ['09:00', '13:00', '18:00']
  instructions: text("instructions"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Medication Administration Log
export const medicationAdministration = pgTable("medication_administration", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id),
  medicationId: varchar("medication_id").references(() => patientMedications.id),
  employeeId: varchar("employee_id").references(() => employees.id),
  scheduledTime: timestamp("scheduled_time").notNull(),
  administeredAt: timestamp("administered_at"),
  status: varchar("status").notNull(), // 'pending', 'administered', 'missed', 'refused'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily Care Tasks
export const dailyCareTasks = pgTable("daily_care_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id),
  employeeId: varchar("employee_id").references(() => employees.id),
  taskDate: date("task_date").notNull(),
  breakfast: boolean("breakfast").default(false),
  lunch: boolean("lunch").default(false),
  dinner: boolean("dinner").default(false),
  bowelMovement: boolean("bowel_movement").default(false),
  customTasks: text("custom_tasks").array(), // ['Shower', 'Physical therapy']
  completedCustomTasks: text("completed_custom_tasks").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scheduled Tasks
export const scheduledTasks = pgTable("scheduled_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id),
  taskName: varchar("task_name").notNull(),
  description: text("description"),
  frequency: varchar("frequency").notNull(), // 'daily', 'weekly', 'monthly', 'custom'
  scheduledDays: text("scheduled_days").array(), // ['monday', 'wednesday', 'friday']
  lastCompleted: timestamp("last_completed"),
  nextDue: timestamp("next_due").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Task Completion Log
export const taskCompletions = pgTable("task_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scheduledTaskId: varchar("scheduled_task_id").references(() => scheduledTasks.id),
  patientId: varchar("patient_id").references(() => patients.id),
  employeeId: varchar("employee_id").references(() => employees.id),
  completedAt: timestamp("completed_at").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewerId: varchar("reviewer_id").references(() => users.id),
  targetId: varchar("target_id"), // employee or patient ID
  targetType: varchar("target_type"), // 'employee', 'patient'
  rating: integer("rating"),
  comment: text("comment"),
  isAddressed: boolean("is_addressed").default(false),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payroll records
export const payrollRecords = pgTable("payroll_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id),
  month: varchar("month").notNull(),
  year: integer("year").notNull(),
  salaryAmount: decimal("salary_amount", { precision: 10, scale: 2 }),
  hoursWorked: decimal("hours_worked", { precision: 5, scale: 2 }),
  healthInsuranceEmployee: decimal("health_insurance_employee", { precision: 10, scale: 2 }),
  healthInsuranceEmployer: decimal("health_insurance_employer", { precision: 10, scale: 2 }),
  pensionEmployee: decimal("pension_employee", { precision: 10, scale: 2 }),
  pensionEmployer: decimal("pension_employer", { precision: 10, scale: 2 }),
  loans: decimal("loans", { precision: 10, scale: 2 }).default('0'),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Documents
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: varchar("entity_id").notNull(), // patient or employee ID
  entityType: varchar("entity_type").notNull(), // 'patient', 'employee'
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  fileType: varchar("file_type"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
  }),
  familyMember: one(familyMembers, {
    fields: [users.id],
    references: [familyMembers.userId],
  }),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  familyMembers: many(familyMembers),
  employeeAssignments: many(patientEmployeeAssignments),
  appointments: many(appointments),
  employeeNotes: many(employeeNotes),
}));

export const employeesRelations = relations(employees, ({ many, one }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  patientAssignments: many(patientEmployeeAssignments),
  appointments: many(appointments),
  employeeNotes: many(employeeNotes),
  payrollRecords: many(payrollRecords),
}));

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  user: one(users, {
    fields: [familyMembers.userId],
    references: [users.id],
  }),
  patient: one(patients, {
    fields: [familyMembers.patientId],
    references: [patients.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCrmLeadSchema = createInsertSchema(crmLeads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeNoteSchema = createInsertSchema(employeeNotes).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertPayrollRecordSchema = createInsertSchema(payrollRecords).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertPatientMedicationSchema = createInsertSchema(patientMedications).omit({
  id: true,
  createdAt: true,
});

export const insertMedicationAdministrationSchema = createInsertSchema(medicationAdministration).omit({
  id: true,
  createdAt: true,
});

export const insertDailyCareTaskSchema = createInsertSchema(dailyCareTasks).omit({
  id: true,
  createdAt: true,
});

export const insertScheduledTaskSchema = createInsertSchema(scheduledTasks).omit({
  id: true,
  createdAt: true,
});

export const insertTaskCompletionSchema = createInsertSchema(taskCompletions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;

export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertCrmLead = z.infer<typeof insertCrmLeadSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type EmployeeNote = typeof employeeNotes.$inferSelect;
export type InsertEmployeeNote = z.infer<typeof insertEmployeeNoteSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type PayrollRecord = typeof payrollRecords.$inferSelect;
export type InsertPayrollRecord = z.infer<typeof insertPayrollRecordSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type PatientMedication = typeof patientMedications.$inferSelect;
export type InsertPatientMedication = z.infer<typeof insertPatientMedicationSchema>;

export type MedicationAdministration = typeof medicationAdministration.$inferSelect;
export type InsertMedicationAdministration = z.infer<typeof insertMedicationAdministrationSchema>;

export type DailyCareTask = typeof dailyCareTasks.$inferSelect;
export type InsertDailyCareTask = z.infer<typeof insertDailyCareTaskSchema>;

export type ScheduledTask = typeof scheduledTasks.$inferSelect;
export type InsertScheduledTask = z.infer<typeof insertScheduledTaskSchema>;

export type TaskCompletion = typeof taskCompletions.$inferSelect;
export type InsertTaskCompletion = z.infer<typeof insertTaskCompletionSchema>;
